import { Wand2 } from "lucide-react";

export function LoadingOverlayServer() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-xl"
            style={{ backgroundColor: "#0F59FF" }}
          >
            <Wand2 className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
          <div
            className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full animate-ping opacity-50"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute top-1 -left-2 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-60"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="text-white font-medium">Loading…</div>

        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>
    </div>
  );
}
