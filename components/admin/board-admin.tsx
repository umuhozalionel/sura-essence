"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle, ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Mail, Pencil, Plus, RefreshCw, Share2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminBoardMember } from "@/lib/board-members";
import { PageHeader } from "./page-header";
import { AdminDialog } from "./admin-dialog";
import { BoardMemberEditor } from "./board-member-editor";
import { SessionEnded, Thumb, boardApi } from "./board-shared";

type LoadResult = { items: AdminBoardMember[] } | { error: "load" | "notConfigured" } | { sessionEnded: true };

async function fetchAll(): Promise<LoadResult> {
  try {
    return await boardApi<{ items: AdminBoardMember[] }>("/api/admin/board-members");
  } catch (err) {
    if (err instanceof SessionEnded) return { sessionEnded: true };
    return { error: (err as { status?: number }).status === 503 ? "notConfigured" : "load" };
  }
}

type Busy = "visibility" | "delete" | "move";

/** Board members: who appears in the homepage founders section, in what order. */
export function BoardAdmin() {
  const t = useTranslations("Admin.team");
  const tc = useTranslations("Admin.common");
  const format = useFormatter();
  const router = useRouter();

  const [items, setItems] = useState<AdminBoardMember[] | null>(null);
  const [loadError, setLoadError] = useState<"load" | "notConfigured" | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, Busy>>({});
  const [editing, setEditing] = useState<AdminBoardMember | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminBoardMember | null>(null);

  const sessionEnded = useCallback(() => {
    toast.error(tc("sessionEnded"));
    router.refresh(); // the layout sees no cookie and shows the sign-in form
  }, [router, tc]);

  const apply = useCallback(
    (result: LoadResult) => {
      if ("sessionEnded" in result) return sessionEnded();
      if ("error" in result) setLoadError(result.error);
      else {
        setItems(result.items);
        setLoadError(null);
      }
      setLoading(false);
    },
    [sessionEnded],
  );

  useEffect(() => {
    let live = true;
    void fetchAll().then((result) => {
      if (live) apply(result);
    });
    return () => {
      live = false;
    };
  }, [apply]);

  const reload = () => {
    setLoading(true);
    void fetchAll().then(apply);
  };

  const markBusy = (id: string, what: Busy | null) =>
    setBusy((b) => {
      const next = { ...b };
      if (what) next[id] = what;
      else delete next[id];
      return next;
    });

  const replace = (updated: AdminBoardMember) =>
    setItems((list) => {
      if (!list) return [updated];
      return list.some((x) => x.id === updated.id) ? list.map((x) => (x.id === updated.id ? updated : x)) : [...list, updated];
    });

  const setVisible = async (item: AdminBoardMember, visible: boolean) => {
    markBusy(item.id, "visibility");
    try {
      const { item: updated } = await boardApi<{ item: AdminBoardMember }>(`/api/admin/board-members/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible }),
      });
      replace(updated);
      toast.success(visible ? t("shownToast") : t("hiddenToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(item.id, null);
    }
  };

  const move = async (index: number, delta: -1 | 1) => {
    if (!items) return;
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = items;
    setItems(next); // feels instant; put back if the save fails
    markBusy(items[index].id, "move");
    try {
      const { items: saved } = await boardApi<{ items: AdminBoardMember[] }>("/api/admin/board-members/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((x) => x.id) }),
      });
      setItems(saved);
      toast.success(t("orderToast"));
    } catch (err) {
      setItems(previous);
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(items[index].id, null);
    }
  };

  const remove = async () => {
    const item = toDelete;
    if (!item) return;
    setToDelete(null);
    markBusy(item.id, "delete");
    try {
      await boardApi(`/api/admin/board-members/${item.id}`, { method: "DELETE" });
      setItems((list) => list?.filter((x) => x.id !== item.id) ?? list);
      toast.success(t("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(item.id, null);
    }
  };

  const visibleCount = items?.filter((i) => i.visible).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
              {t("refresh")}
            </Button>
            <Button onClick={() => setEditing("new")} disabled={items === null || Boolean(loadError)}>
              <Plus aria-hidden />
              {t("add")}
            </Button>
          </>
        }
      />

      <section aria-label={t("listLabel")} className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3 text-sm">
          <p className="font-medium">{t("listLabel")}</p>
          {items && (
            <p className="text-muted-foreground tabular-nums">
              {t("summary", { visible: format.number(visibleCount), total: format.number(items.length) })}
            </p>
          )}
        </div>

        {loadError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 px-5 py-10 text-sm">
            <AlertCircle className="size-5 text-destructive" aria-hidden />
            {loadError === "notConfigured" ? t("notConfigured") : t("loadError")}
            {loadError === "load" && (
              <Button variant="link" className="h-auto p-0" onClick={reload}>{t("retry")}</Button>
            )}
          </div>
        ) : items === null ? (
          <div className="divide-y" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <div className="h-[72px] w-[58px] animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-44 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full max-w-sm animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
            <Button className="mt-4" onClick={() => setEditing("new")}>
              <Plus aria-hidden />
              {t("add")}
            </Button>
          </div>
        ) : (
          <ol className="divide-y">
            {items.map((item, index) => {
              const doing = busy[item.id];
              return (
                <li key={item.id} className={cn("p-4 sm:p-5", doing === "delete" && "opacity-50")}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <Thumb item={item} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{item.name}</p>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                              item.visible ? "bg-background" : "bg-muted text-muted-foreground",
                            )}
                          >
                            <span
                              className={cn("size-1.5 rounded-full", item.visible ? "bg-[var(--status-confirmed)]" : "bg-muted-foreground/50")}
                              aria-hidden
                            />
                            {item.visible ? t("status.visible") : t("status.hidden")}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{item.role.en || t("noRole")}</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {item.email && (
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="size-3.5" aria-hidden />
                              {item.email}
                            </span>
                          )}
                          {item.socials.length > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                              <Share2 className="size-3.5" aria-hidden />
                              {t("socialsCount", { count: item.socials.length })}
                            </span>
                          )}
                          {!item.role.fr && <span>{t("missingFrench")}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => void move(index, -1)}
                        disabled={index === 0 || Boolean(doing) || Object.values(busy).includes("move")}
                        aria-label={t("moveUp", { name: item.name })}
                        title={t("moveUpShort")}
                      >
                        <ArrowUp aria-hidden />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => void move(index, 1)}
                        disabled={index === items.length - 1 || Boolean(doing) || Object.values(busy).includes("move")}
                        aria-label={t("moveDown", { name: item.name })}
                        title={t("moveDownShort")}
                      >
                        <ArrowDown aria-hidden />
                      </Button>
                      <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
                      <Button size="sm" variant="outline" onClick={() => void setVisible(item, !item.visible)} disabled={Boolean(doing)}>
                        {doing === "visibility" ? (
                          <Loader2 className="animate-spin" aria-hidden />
                        ) : item.visible ? (
                          <EyeOff aria-hidden />
                        ) : (
                          <Eye aria-hidden />
                        )}
                        {item.visible ? t("hide") : t("show")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(item)} disabled={Boolean(doing)}>
                        <Pencil aria-hidden />
                        {t("edit")}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setToDelete(item)}
                        disabled={Boolean(doing)}
                        aria-label={t("deleteNamed", { name: item.name })}
                        title={t("delete")}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        {doing === "delete" ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <BoardMemberEditor
        key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
        member={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved, created) => {
          replace(saved);
          setEditing(null);
          toast.success(created ? t("createdToast") : t("savedToast"));
        }}
        onSessionEnded={sessionEnded}
      />

      <AdminDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t("confirmTitle")}
        description={toDelete ? t("confirmDelete", { name: toDelete.name }) : undefined}
        closeLabel={tc("close")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)}>{tc("cancel")}</Button>
            <Button variant="destructive" onClick={() => void remove()}>
              <Trash2 aria-hidden />
              {t("confirmYes")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t("confirmNote")}</p>
      </AdminDialog>
    </div>
  );
}
