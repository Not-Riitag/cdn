const Express = require("express");
const { SessionManager, UserManager } = require("./data-controller/index");
const Permissions = require("./data-controller/src/Enum/EnumPermissions");
const { NOT_FOUND, ACCESS_DENIED, FILE_UPLOADED, UPLOAD_FAILED } = require("./Messages");
const Busboy = require("busboy");

const fs = require("fs");
const path = require("path");

const dataFolder = path.join(__dirname, "data");

const app = Express();

function sendResponse(res, err) {
    res.status(err.status).json(err);
}

async function authenticateRequest(req, res, next) {
    const token = req.headers.authorization;

    if (!(session = await SessionManager.getSession(token))) return sendResponse(res, ACCESS_DENIED);
    if (!(user = await UserManager.getUser({ id: session.user }))) return sendResponse(res, ACCESS_DENIED);

    if (user.permissions.has(Permissions.UPLOAD_CONTENT)) {
        console.log(`${user.username} was authenticated to upload a file.`)
        next();
    } else
        return sendResponse(res, ACCESS_DENIED);
}

// Upload file from the client
app.put("*", authenticateRequest, (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    var fileUploaded = false;

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        const fileFolder = path.join(dataFolder, req.url);
        fs.mkdirSync(fileFolder, { recursive: true });

        file.pipe(fs.createWriteStream(path.join(fileFolder, filename)));
        fileUploaded = true;
    });

    busboy.on("finish", () => {
        if (!fileUploaded) return sendResponse(res, UPLOAD_FAILED);
        res.status(FILE_UPLOADED.status).json(FILE_UPLOADED.message);
    });

    return req.pipe(busboy);
});

// Send the file to the client, if it exists
app.get("*", (req, res) => {
    const fileName = req.url;
    const filePath = path.join(dataFolder, fileName);

    if (!fs.existsSync(filePath)) return sendResponse(res, NOT_FOUND);

    res.sendFile(filePath);
});

app.listen(3005, () => console.log("Server started on port 3005"));