import  { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

const ws = new WebSocket("https://gridapp-backend.onrender.com/");
const deviceId = uuid();

export default function GridApp() {
  const [blocks, setBlocks] = useState(
    Array(9).fill({ content: "", lockedBy: null })
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setBlocks((prev) => {
        const updated = [...prev];
        if (data.type === "init") return data.blocks;
        if (data.type === "update") updated[data.blockId].content = data.content;
        if (data.type === "lock") updated[data.blockId].lockedBy = data.deviceId;
        return updated;
      });
    };
  }, []);

  const send = (data: any) => ws.send(JSON.stringify(data));

  const handleChange = (i: number, val: string) => {
    send({ type: "update", blockId: i, content: val, deviceId });
  };

  const handleFocus = (i: number) => {
    send({ type: "lock", blockId: i, deviceId });
  };

  const handleDragStart = (i: number) => {
    setDragIndex(i);
  };

  const handleDrop = (i: number) => {
    if (dragIndex === null || i === dragIndex) return;
    if (blocks[i].content !== "") return;

    const draggedContent = blocks[dragIndex].content;

    // Clear dragged block and unlock it
    send({ type: "update", blockId: dragIndex, content: "", deviceId: null });
    send({ type: "lock", blockId: dragIndex, deviceId: null });

    // Update dropped block and lock it
    send({ type: "update", blockId: i, content: draggedContent, deviceId });
    send({ type: "lock", blockId: i, deviceId });

    setDragIndex(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold mb-8 text-blue-900 select-none">
         Grid App!
      </h1>
      <div className="grid grid-cols-3 gap-6 max-w-md w-full">
        {blocks.map((block, i) => (
          <textarea
  key={i}
  // Only allow dragging if block has content AND not locked by other devices
  draggable={block.content !== "" && (!block.lockedBy || block.lockedBy === deviceId)}
  onDragStart={() => {
    if (!block.lockedBy || block.lockedBy === deviceId) {
      handleDragStart(i);
    }
  }}
  onDragOver={(e) => e.preventDefault()}
  onDrop={() => {
    if (!block.lockedBy || block.lockedBy === deviceId) {
      handleDrop(i);
    }
  }}
  value={block.content}
  onChange={(e) => {
    if (!block.lockedBy || block.lockedBy === deviceId) {
      handleChange(i, e.target.value);
    }
  }}
  onFocus={() => {
    if (!block.lockedBy || block.lockedBy === deviceId) {
      handleFocus(i);
    }
  }}
  readOnly={block.lockedBy && block.lockedBy !== deviceId}
  placeholder="Type here..."
  className={`
    h-32 rounded-xl p-4 resize-none border transition-all
    shadow-lg bg-white text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-4 focus:ring-blue-300
    cursor-text
    ${
      block.lockedBy && block.lockedBy !== deviceId
        ? "bg-gray-200 opacity-70 cursor-not-allowed red-not-allowed"
        : "hover:shadow-2xl"
    }
  `}
/>

        ))}
      </div>
    </div>
  );
}
