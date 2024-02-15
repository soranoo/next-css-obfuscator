export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#fac3e3] to-[#5c9cbd] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Next14 App Router
        </h1>
      </div>
      <div className="next-css-obfuscation container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <span className="text-2xl font-extrabold tracking-tight text-gray-700 border-2 border-blue-950 rounded-lg p-4">
          My classes are obfuscated
        </span>
      </div>
    </main>
  );
}
