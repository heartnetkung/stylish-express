const isProduction = process.env.NODE_ENV === "production";
const connectionString = isProduction ? "fill me in" : "mongodb://localhost";
const dbName = "wong_share";

module.exports = {
	connectionString,
	dbName,
	isProduction,
	connectionStringFull: connectionString + "/" + dbName,
	jsonwebtoken: "wong_share_token",
	port: 3000
};
