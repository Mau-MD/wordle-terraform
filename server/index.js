const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const wordList = require('word-list-json');

const app = express();
const PORT = process.env.PORT || 3000;
const versionId = Math.random().toString(36).substring(2, 15);

// Configure AWS
AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.ECSCredentials()
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'wordle-leaderboard';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Filter 5-letter words and create word bank
const wordBank = wordList.filter(word => word.length === 5);
let currentWord = '';

// Read/Write leaderboard
async function getLeaderboard() {
    const params = {
        TableName: TABLE_NAME,
    };

    try {
        const data = await dynamodb.scan(params).promise();
        return data.Items || [];
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
}

async function saveScore(scoreData) {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            id: Date.now().toString(), // Use timestamp as unique ID
            name: scoreData.name,
            attempts: scoreData.attempts,
            time: scoreData.time,
            date: new Date().toISOString()
        }
    };

    try {
        await dynamodb.put(params).promise();
    } catch (error) {
        console.error('Error saving score:', error);
        throw error;
    }
}

// Get a new word
app.get('/api/word', (req, res) => {
    try {
        currentWord = wordBank[Math.floor(Math.random() * wordBank.length)];
        res.json({ length: currentWord.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get word' });
    }
});

// Check guess
app.post('/api/guess', (req, res) => {
    try {
        const { guess } = req.body;

        if (!wordBank.includes(guess.toLowerCase())) {
            return res.json({ valid: false, message: 'Not a valid word' });
        }

        const result = Array(5).fill('');
        const guessLower = guess.toLowerCase();
        const wordLower = currentWord.toLowerCase();

        // Check for correct letters in correct positions
        for (let i = 0; i < 5; i++) {
            if (guessLower[i] === wordLower[i]) {
                result[i] = 'correct';
            } else if (wordLower.includes(guessLower[i])) {
                result[i] = 'present';
            } else {
                result[i] = 'absent';
            }
        }

        const isCorrect = guessLower === wordLower;
        res.json({ valid: true, result, isCorrect });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check guess' });
    }
});

// Submit score
app.post('/api/score', async (req, res) => {
    try {
        const { name, attempts, time } = req.body;
        await saveScore({ name, attempts, time });
        const scores = await getLeaderboard();
        scores.sort((a, b) => a.attempts - b.attempts || a.time - b.time);
        res.json({ success: true });
    } catch (error) {
        console.error('Error in /api/score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const scores = await getLeaderboard();
        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// Version endpoint
app.get('/api/version', (req, res) => {
    res.json({ version: versionId });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Word bank loaded with ${wordBank.length} five-letter words`);
}); 