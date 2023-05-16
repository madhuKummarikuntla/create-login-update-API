const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = () => {
  try {
    db = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Is Running At http://localhost:3000");
    });
  } catch (e) {
    console(`DB Error :${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
/// Validate Password
const validatePassword = (password) => {
  password.length > 4;
};
///Register API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;

    if (validatePassword(password)) {
      await db.run(createUserQuery);
      response.send("User Created Successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already Exists");
  }
});
///login user api
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("User Login Success");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
///Update Password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
   SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
          user
          password = '${hashedPassword}'
          WHERE
          username = '${username}';`;
        const user = await db.run(updatePasswordQuery);
        response.send("Password Updated Successfully");
      } else {
        response.status(400);
        response.send("Password is too Short");
      }
    } else {
      response.status(400);
      response.send("Invalid current Password");
    }
  }
});
module.exports = app;
