export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <form className="bg-black/50 p-8 rounded-lg backdrop-blur-md">
        <h2 className="text-2xl text-psycho-blue mb-4">Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="block mb-4 w-full p-2 rounded bg-gray-800 text-white"
        />
        <input
          type="password"
          placeholder="Password"
          className="block mb-6 w-full p-2 rounded bg-gray-800 text-white"
        />
        <button className="w-full py-2 bg-neon-green text-black font-semibold rounded">
          Submit
        </button>
      </form>
    </div>
  );
}
