const express = require("express");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require('sharp');
const { sendWelcomeEmail } = require('../emails/account');
const User = require("../models/user");
const router = express.Router();

// sign in
router.post("/users", async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();

        res.status(200).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});
router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
});

// login
router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(
            req.body.email, //email
            req.body.password // password
        );
        const token = await user.generateAuthToken(); // token
        res.send({ user, token });
    } catch (error) {
        res.status(400).send();
    }
});

// logout nguoi dung tùy theo token gửi lên
router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send("logout success");
    } catch (error) {
        res.status(500).send();
    }
});

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.patch("/users/me", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const alowedUpdates = ["name", "email", "password", "age"];
    const isValidOperation = updates.every((
        update //
    ) => alowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates" });
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();

        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (error) {
        res.status(500).send("error");
    }
});
var upload = multer({
    limits: {
        fileSize: 2000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload an image"));
        }
        cb(undefined, true);
    },
});
router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer();  // định dạng image req
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// delete avatar 
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar)
    } catch (error) {
        res.send(404).send();
    }
})

module.exports = router;
