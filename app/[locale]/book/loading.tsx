// Shown the moment a "Book" link is clicked, while /book loads. It has the same
// full-screen frame as the booking page (background, top bar, form and map card),
// so the switch from a long page lands on a finished-looking screen at once instead
// of the old page snapping to the top and then being replaced.
export default function BookLoading() {
  return (
    <div
      aria-busy="true"
      className="min-h-dvh lg:h-dvh lg:min-h-[640px] flex flex-col bg-[#0A1128] bg-cover bg-center bg-no-repeat py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(10, 17, 40, 0.45), rgba(10, 17, 40, 0.45)), url('/backgrounds/nyungwe_sky.jpg')",
      }}
    >
      <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
        <div className="h-[42px] w-28 rounded-full bg-white/80 animate-pulse" />
        <div className="h-12 w-44 rounded-full bg-white/80 animate-pulse" />
      </div>

      <div className="w-full max-w-[1800px] mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-2xl shadow-black/30 bg-white">
        <div className="order-2 lg:order-1 p-6 sm:p-10 space-y-5">
          <div className="h-11 rounded-full bg-gray-100 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
            <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
            <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
          </div>
          <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
        </div>
        <div className="order-1 lg:order-2 h-56 sm:h-72 lg:h-full bg-[#E5E5E5] animate-pulse" />
      </div>
    </div>
  );
}
