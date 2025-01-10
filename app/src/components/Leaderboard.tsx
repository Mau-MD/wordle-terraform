interface Score {
    name: string;
    attempts: number;
    time: number;
    date: string;
}

interface LeaderboardProps {
    scores: Score[];
    onClose: () => void;
}

export default function Leaderboard({ scores, onClose }: LeaderboardProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Leaderboard</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {scores.length === 0 ? (
                    <p className="text-gray-600 text-center">No scores yet!</p>
                ) : (
                    <div className="space-y-4">
                        {scores.map((score, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 bg-gray-50"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">#{index + 1} {score.name}</span>
                                    <span className="text-gray-600">{new Date(score.date).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-2 text-gray-600">
                                    <p>Attempts: {score.attempts}</p>
                                    <p>Time: {Math.round(score.time / 1000)}s</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 