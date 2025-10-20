import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.post('/api/search', async (req, res) => {
  console.log('Search request received:', req.body);
  
  // Возвращаем mock данные
  const mockResults = [
    {
      id: '1',
      title: 'AMD Radeon RX 580 8GB',
      price: 450,
      location: 'Warszawa',
      description: 'Karta graficzna w dobrym stanie',
      image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
      seller: 'Jan Kowalski',
    },
    {
      id: '2',
      title: 'RX 580 NITRO+ 8GB',
      price: 550,
      location: 'Kraków',
      description: 'Sapphire RX 580 NITRO+',
      image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
      seller: 'Anna Nowak',
    },
  ];
  
  res.json({
    results: mockResults,
    count: mockResults.length,
    source: 'test-backend',
    marketplace: 'olx',
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 TEST Backend server running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
🔍 Search: POST http://localhost:${PORT}/api/search
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
