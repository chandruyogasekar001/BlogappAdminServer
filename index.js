const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://chandru1:123456dcba123@cluster0.kxaxwvq.mongodb.net/blogdbX', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define schema and models
const { Schema } = mongoose;

const subheadingSchema = new Schema({
  subheading: String,
  description: String
});

const headingSchema = new Schema({
  title: String,
  subheadings: [subheadingSchema]
});

const groupSchema = new Schema({
  name: String,
  headings: [headingSchema]
});

const Group = mongoose.model('Group', groupSchema);

// Add group route
app.post('/api/groups', async (req, res) => {
  try {
    const { name } = req.body;
    const newGroup = new Group({ name, headings: [] });
    await newGroup.save();
    res.status(201).json({ message: 'Group added successfully' });
  } catch (error) {
    console.error('Error adding group:', error.message);
    res.status(500).json({ error: 'Failed to add group' });
  }
});

// Fetch groups route
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await Group.find();
    res.json({ data: groups });
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Add heading to group route
app.post('/api/groups/:groupId/headings', async (req, res) => {
  try {
    const { title, subheadings } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    group.headings.push({ title, subheadings });
    await group.save();
    res.status(201).json({ message: 'Heading added successfully' });
  } catch (error) {
    console.error('Error adding heading:', error.message);
    res.status(500).json({ error: 'Failed to add heading' });
  }
});

// Fetch headings in group route
app.get('/api/groups/:groupId/headings', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ data: group.headings });
  } catch (error) {
    console.error('Error fetching headings:', error.message);
    res.status(500).json({ error: 'Failed to fetch headings' });
  }
});

// Delete group route
app.delete('/api/groups/:id', async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
 

// Delete heading route
app.delete('/api/groups/:groupId/headings/:headingId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    group.headings.pull(req.params.headingId);
    await group.save();
    res.json({ message: 'Heading deleted successfully' });
  } catch (error) {
    console.error('Error deleting heading:', error.message);
    res.status(500).json({ error: 'Failed to delete heading' });
  }
});
app.get('/api/groups/:groupId/headings', async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ headings: group.headings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update headings of a specific group
app.put('/api/groups/:groupId/headings/:headingId', async (req, res) => {
  try {
    const { title, subheading, description } = req.body;
    const { groupId, headingId } = req.params;

    // Find the group by ID
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Find the heading by ID within the group
    const heading = group.headings.id(headingId);
    if (!heading) {
      return res.status(404).json({ error: 'Heading not found' });
    }

    // Update the heading's title
    heading.title = title;

    // Find the subheading by ID within the heading
    const subheadingId = req.body.subheadingId; // Get the subheadingId from the request body
    const subheadingDoc = heading.subheadings.id(subheadingId);
    if (!subheadingDoc) {
      return res.status(404).json({ error: 'Subheading not found' });
    }

    // Update the subheading's subheading and description
    subheadingDoc.subheading = subheading;
    subheadingDoc.description = description;

    // Save the changes to the database
    await group.save();

    res.json({ message: 'Heading and subheading updated successfully' });
  } catch (error) {
    console.error('Error updating heading:', error);
res.status(500).json({ error: 'Failed to update heading', details: error.message });

  }
});



app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
