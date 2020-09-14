const mongoose = require("mongoose");
const validator = require("validator");
const bcypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("../models/task");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        trim: true,
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid");
            }
        },
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age must be  a postive number");
            }
        },
    },
    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error('Password cannot contain "password"');
            }
        },
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true,
});
userSchema.virtual("tasks", {
    // create field tasks ảo
    ref: "Task",
    localField: "_id",
    foreignField: "owner", // khóa ngoại
});

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email }); // find user
    if (!user) {
        throw new Error("Unable to login");
    }

    const isMatch = await bcypt.compare(password, user.password); // so sanh passrord voi has password in database
    if (!isMatch) {
        throw new Error("Unable to login");
    }

    return user; // tra ve user
};

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, "thisismynewcourse");
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

// tra ve user ko co password va token
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    return userObject;
};

// hash the plain text  password before saving
userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcypt.hash(user.password, 8);
    }
    next();
});

// delete user tasks when user is remove
userSchema.pre("remove", async function (next) {
    const user = this;
    await Task.deleteMany({
        owner: user._id,
    });
    next();
});
const User = mongoose.model("User", userSchema);

module.exports = User;
