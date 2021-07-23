import express from "express";
import { MongoClient } from "mongodb";
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(express.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://root:root@localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');
        await operations(db);
        client.close();
    } catch (err) {
        res.status(500).json({ message: 'Error connecting to db', err });
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articlesInfo);
    }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            $inc: { upvotes: 1 }
        });
        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticleInfo);
    }, res);
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            $push: {
                comments: { username: username, text: text }
            }
        });
        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticleInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log("listening on port 8000"));