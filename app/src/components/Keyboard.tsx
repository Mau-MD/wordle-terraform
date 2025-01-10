interface KeyboardProps {
    onKey: (key: string) => void;
    usedLetters: Record<string, string>;
}

const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
];

export default function Keyboard({ onKey, usedLetters }: KeyboardProps) {
    const getKeyClass = (key: string) => {
        const baseClass = "px-2 py-4 rounded font-bold text-sm sm:text-base cursor-pointer select-none";
        if (key === 'Enter' || key === 'Backspace') {
            return `${baseClass} px-4 bg-gray-300`;
        }

        const status = usedLetters[key];
        if (status === 'correct') return `${baseClass} bg-green-500 text-white`;
        if (status === 'present') return `${baseClass} bg-yellow-500 text-white`;
        if (status === 'absent') return `${baseClass} bg-gray-500 text-white`;
        return `${baseClass} bg-gray-200`;
    };

    return (
        <div className="grid gap-2">
            {KEYBOARD_ROWS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1">
                    {row.map((key) => (
                        <button
                            key={key}
                            onClick={() => onKey(key)}
                            className={getKeyClass(key)}
                        >
                            {key === 'Backspace' ? '←' : key}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
} 