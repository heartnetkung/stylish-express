const createError = require("http-errors");
const express = require("express");
const session = require("express-session");
const cookie = require("cookie-parser");
const logger = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const glob = require("glob");
const MongoStore = require("connect-mongo")(session);
const schemaInjection = require("./shared/middleware/schema_injection");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const config = require("./config");
require("express-async-errors");

// db init
/*mongoose.set is better than mongoose.connect in case we have multiple connections*/
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", true);
mongoose.connect(config.connectionStringFull, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

// middleware stack
const app = express();
app.use(helmet({ dnsPrefetchControl: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(schemaInjection);
app.use(logger("dev"));
// app.use(cookie());
app.use(compression());
app.use(
	session({
		name: "sid", // ถ้าไม่กำหนด ค่าเริ่มต้นเป็น 'connect.sid'
		secret: "reamco",
		resave: true,
		store: new MongoStore({ mongooseConnection: mongoose.connection }),
		saveUninitialized: true,
		cookie: { maxAge: 1000 * 60 * 60 * 1 }
	})
);

// require all controllers
for (var file of glob.sync(path.join(__dirname, "/node_app/controller/*.js")))
	app.use("/app/" + path.basename(file, ".js"), require(file));
for (var file of glob.sync(path.join(__dirname, "/node_staff/controller/*.js")))
	app.use("/staff/" + path.basename(file, ".js"), require(file));

// error handling
app.use((req, res, next) => next(createError(404)));
app.use((err, req, res, next) =>
	res.status(err.status || 500).send({ error: "Unhandled!" })
);

// start server
var server = app.listen(config.port);
server.on("error", error => {
	if (error.syscall !== "listen") throw error;
	if (error.code === "EACCESS") console.error("requires elevated privileges");
	else if (error.code === "EADDRINUSE") console.error("port is already in use");
	else throw error;
	process.exit(1);
});

// graceful shutdown
function shutdown() {
	server.close(function(err) {
		if (err) {
			console.error(err);
			return process.exit(1);
		}
		mongoose.disconnect(function(err) {
			if (err) {
				console.error(err);
				return process.exit(1);
			}
			return process.exit(0);
		});
	});
}
process.on("SIGINT", shutdown).on("SIGTERM", shutdown);
