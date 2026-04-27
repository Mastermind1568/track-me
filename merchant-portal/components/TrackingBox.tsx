import { useState } from "react"
import { useRouter } from "next/router"

export default function TrackingBox() {
  const [value, setValue] = useState("")
  const router = useRouter()
  const go = (e: any) => {
    e.preventDefault()
    if (!value) return
    router.push(`/track/${value}`)
  }
  return (
    <form onSubmit={go} className="flex gap-2 items-center">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter tracking number"
        className="flex-1 border p-3 rounded"
      />
      <button type="submit" className="bg-quickship-500 text-white px-4 py-2 rounded">
        Track
      </button>
    </form>
  )
}
