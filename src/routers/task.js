const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");
router.post("/tasks", auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id,
    });
    try {
        await task.save();
        res.status(200).send(task);
    } catch (error) {
        res.status(500).send();
    }
});

// Get /tasks?limit=10&skip=20;
router.get("/tasks", auth, async (req, res) => {
    const match = {};
    const sort = {};
    if (req.query.completed) {
        match.completed = req.query.completed === "true";
    }

    if (req.query.sortBy) {
        const part = req.query.sortBy.split(":");
        console.log(part);
        sort[part[0]] = part[1] === "desc" ? -1 : 1;
    }
    try {
        // const tasks = Task.find({ owner: req.user._id });  c1
        await req.user
            .populate({
                path: "tasks",
                match,
                options: {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort,
                },
            })
            .execPopulate(); // c2

        res.status(200).send(req.user.tasks);
    } catch (error) {
        res.status(500).send();
    }
});

router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;
    console.log(_id);
    try {
        const task = await Task.findOne({ _id, owner: req.user._id }); // cach 2
        if (!task) {
            return res.status(404).send();
        }

        res.status(200).send(task);
    } catch (error) {
        res.status(500).send();
    }
});

router.patch("/tasks/:id", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const alowedUpates = ["description", "completed"];
    const isValidOperation = updates.every((update) =>
        alowedUpates.includes(update)
    );
    console.log(isValidOperation);
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates" });
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id,
        });

        if (!task) {
            res.status(404).send();
        }
        updates.forEach((update) => {
            task[update] = req.body[update];
        });
        await task.save();
        res.status(200).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOneAndDelete({ _id: _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;
