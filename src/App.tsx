import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

const ws = new WebSocket("https://gridapp-backend.onrender.com/"); // Use wss for secure WS
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
        if (data.type === "update")
          updated[data.blockId].content = data.content;
        if (data.type === "lock")
          updated[data.blockId].lockedBy = data.deviceId;
        if (data.type === "clear") {
  return Array(9).fill({ content: "", lockedBy: null });
}

        return updated;
      });
    };
  }, []);

  const send = (data: any) => ws.send(JSON.stringify(data));

  const handleChange = (i: number, val: string) => {
    const input = val.trim().slice(0, 2); // max 2 characters
    if (input.length === 1) {
      // First char must be alpha or digit
      if (!/^[a-zA-Z0-9]$/.test(input)) return;
    } else if (input.length === 2) {
      const first = input[0];
      const second = input[1];
      if (
        (/^[a-zA-Z]$/.test(first) && /^[0-9]$/.test(second)) ||
        (/^[0-9]$/.test(first) && /^[a-zA-Z]$/.test(second))
      ) {
        // Valid: one alpha, one digit in any order
      } else {
        return; // Invalid pair, don't send
      }
    }

    send({
      type: "update",
      blockId: i,
      content: input,
      deviceId,
    });
  };

  const handleFocus = (i: number) => {
    if (blocks[i].content !== "") {
      send({ type: "lock", blockId: i, deviceId });
    }
  };

  const handleDragStart = (i: number) => {
    setDragIndex(i);
  };

  const handleBlur = (i: number) => {
    // If content is still empty on blur, unlock the block
    if (blocks[i].content === "") {
      send({ type: "lock", blockId: i, deviceId: null });
    }
  };

  const handleDrop = (i: number) => {
    if (dragIndex === null || i === dragIndex) return;
    if (blocks[i].content !== "") return;

    const draggedContent = blocks[dragIndex].content;

    send({ type: "update", blockId: dragIndex, content: "", deviceId: null });
    send({ type: "lock", blockId: dragIndex, deviceId: null });

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
        {blocks.map((block, i) => {
          const isBlocked = block.lockedBy && block.lockedBy !== deviceId;
          const isRestricted = /[AP37]/i.test(block.content);
          const isValid =
            block.content.length === 2 &&
            ((/^[a-zA-Z]$/.test(block.content[0]) &&
              /^[0-9]$/.test(block.content[1])) ||
              (/^[0-9]$/.test(block.content[0]) &&
                /^[a-zA-Z]$/.test(block.content[1])));

          return (
            <textarea
              key={i}
              draggable={
                block.content !== "" &&
                (!block.lockedBy || block.lockedBy === deviceId)
              }
              onDragStart={() => {
                if (!isBlocked) handleDragStart(i);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!isBlocked) handleDrop(i);
              }}
              value={block.content}
              onChange={(e) => {
                if (!isBlocked) handleChange(i, e.target.value);
              }}
              onFocus={() => {
                if (!isBlocked) handleFocus(i);
              }}
              onBlur={() => {
                if (!isBlocked) handleBlur(i);
              }}
              readOnly={isBlocked}
              placeholder="Type here..."
              className={`
                h-32 rounded-xl p-4 resize-none border transition-all
                shadow-lg placeholder-gray-400 w-full
                focus:outline-none focus:ring-4
                text-center flex items-center justify-center
                text-center pt-12
                ${
                  isBlocked
                    ? "bg-gray-200 opacity-70 cursor-not-allowed"
                    : "cursor-text hover:shadow-2xl"
                }
                ${
                  block.content === ""
                    ? "bg-white text-gray-900 focus:ring-blue-300"
                    : isRestricted
                    ? "bg-[repeating-linear-gradient(45deg,_#fca5a5_0px,_#fca5a5_1px,_#ffffff_1px,_#ffffff_4px)] text-red-700 focus:ring-red-300"
                    : isValid
                    ? "bg-[repeating-linear-gradient(135deg,_#bbf7d0_0px,_#bbf7d0_1px,_#ffffff_1px,_#ffffff_4px)] text-green-800 focus:ring-green-400"
                    : "bg-yellow-100 text-yellow-700 focus:ring-yellow-300"
                }
              `}
            />
          );
        })}
      </div>
      <button
  onClick={() => send({ type: "clear", deviceId })}
  className="mb-6 bg-red-500 text-white my-6 px-4 py-2 rounded hover:bg-red-600 transition"
>
  Clear All
</button>
    </div>
  );
}
