import FlowchartCanvas from "@/components/core/FlowchartCanvas"

/**
 * Home Page Component
 *
 * Main entry point for the application
 *
 * @returns {JSX.Element} The Home page component
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <FlowchartCanvas />
    </main>
  )
}

