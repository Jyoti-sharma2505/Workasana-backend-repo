const { connectDB } = require("./db/db.connect");
connectDB();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");
const User = require("./models/user.models");
const Task = require("./models/task.models");
const Team = require("./models/team.models");
const Project = require("./models/project.models");
const Tag = require("./models/tag.models");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

/////////////////Task APIS//////////////////

////post api to POST /tasks : Create a new task.
async function createNewTask(newTask) {
    try {
        const task = new Task(newTask);
        const savedTask = await task.save();
        return savedTask;
    } catch (err) {
        throw err;
    }
}
app.post("/tasks", async (req, res) => {
    try {
        const newTask = await createNewTask(req.body);
        if (newTask) {
            res.status(201).json("Added successfully", newTask)
        } else {
            res.status(400).json({ message: "Bad Request" })
        }
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})
/////GET /tasks : Fetch tasks with filtering.
async function getTasks() {
    try {
        const tasks = await Task.find().populate("owners", "name email") // <-- owner ka name + email milega
            .populate("project", "name")
            .populate("team", "name");
        return tasks;
    } catch (err) {
        throw err;
    }
}
app.get("/tasks", async (req, res) => {
    try {
        const tasks = await getTasks();
        if (tasks) {
            res.status(200).json(tasks);
        } else {
            res.status(404).json({ message: "No  tasks found" })
        }
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
})

////POST /tasks/:id : Update a task (e.g., mark it as complete or update any other field).
async function updateTask(id,body) {
    try {
        const updatedTask = await Task.findByIdAndUpdate( id,
            body,
            { new: true });
        return updatedTask;
    } catch (err) {
        throw err;
    }
}
app.post("/tasks/:id", async (req, res) => {
    try {
        const updatedTask = await updateTask(req.params.id, req.body);
        if (updatedTask) {
            res.status(200).json(updatedTask);
        } else {
            res.status(404).json({ message: "Task not found" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
})

////DELETE /tasks/:id : Delete a task.
async function deleteTask(id) {
    try {
        const deletedTask = await Task.findByIdAndDelete(id);
        return deletedTask;
    } catch (err) {
        throw err;
    }
}
app.delete("/tasks/:id", async (req, res) => {
    try {
        const deletedTask = await deleteTask(req.params.id);
        if (deletedTask) {
            res.status(200).json({ message: "Task delted successfully" });
        } else {
            res.status(404).json({ message: "Task not found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//////get by id in task/////
async function getTaskById(id){
    try{
    const taskById = await Task.findById(id);
    return taskById;
    }catch(error){
        throw error
    }
}
app.get("/tasks/:id",async(req,res)=>{
    try{
      const getTaskId = await getTaskById(req.params.id);
      if(getTaskId){
        res.status(200).json({ message:"GEt task successfully"})
      }else{
        res.status(401).json({message:"Not get task"})
      }
    }catch(err){
        res.status(500).json({error:"Something went wrong"})
    }
})

///////////Teams APIS///////////////////////

/////POST /teams : Add a new team.
async function createNewTeam(newTeam) {
    try {
        const team = new Team({
            name: newTeam.name,
            description: newTeam.description,
            members: newTeam.members || []   // multiple members support
        });
        const savedTeam = await team.save();
        return savedTeam;
    } catch (err) {
        throw err;
    }
}
app.post("/teams", async (req, res) => {
    try {
        const newTeam = await createNewTeam(req.body);
        if (newTeam) {
            res.status(201).json(newTeam);
        } else {
            res.status(400).json({ message: "bad request" });
        }
    } catch (err) {
        console.log(err,"error")
        res.status(500).json({ message: "Internal server error" })
    }
})

/////GET /teams : Fetch a list of teams.
async function getTeams() {
    try {
        const teams = await Team.find().populate("members","name email");
        return teams;
    } catch (error) {
        throw error;
    }
}
app.get("/teams", async (req, res) => {
    try {
        const teams = await getTeams();
        if (teams) {
            res.status(200).json(teams);
        } else {
            res.status(400).json({ message: "Bad Request" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})

/////post/id team ///
async function updateTeamById(id){
    try{
     const updateTeam = await Team.findById(id).populate("members","name email");
     return updateTeam;
    }catch(error){
        throw error
    }
}
app.get("/team/:id",async(req,res)=>{
    try{
    const updateByID = await updateTeamById(req.params.id);
    if(updateByID){
        res.status(201).json({message:"Added successfully",data:updateByID})
    }else{
        res.status(404).json("Something wents wrong")
    }
    }catch(error){
        res.status(500).json({error:"Interval server error"})
    }
})
   

//post team by is///
// POST: Add member by team ID
async function addMemberbyTeam(teamId, memberId) {
    try {
        // Fetch team
        const team = await Team.findById(teamId);

        if (!team) {
            throw new Error("Team not found");
        }

        // Check if already added
        if (team.members.includes(memberId)) {
            throw new Error("Member already exists in team");
        }

        // Add member
        team.members.push(memberId);
        await team.save();

        // Return updated team
        return await Team.findById(teamId).populate("members");

    } catch (error) {
        throw error;
    }
}
app.post("/team/add-member/:id",async(req,res)=>{
    try{
      const { id } = req.params;
        const { memberId } = req.body;

        const updatedTeam = await addMemberbyTeam(id, memberId);

        res.status(200).json({
            success: true,
            message: "Member added successfully",
            data: updatedTeam
        });
    }catch(error){
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
})


///////Project APIs con be added here////////////

/////POST /projects : Add a new project.
async function createNewProject(newProjects) {
    try {
        const project = new Project(newProjects);
        const savedProject = await project.save();
        return savedProject;
    } catch (err) {
        throw err;
    }
}
app.post("/projects", async (req, res) => {
    try {
        const newProjects = await createNewProject(req.body);
        if (newProjects) {
            res.status(201).json(newProjects);
        } else {
            res.status(400).json({ message: "Bad Request" });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
})

//////GET /projects : Fetch all projects.
async function getProjects() {
    try {
        const projects = await Project.find();
        return projects;
    } catch (err) {
        throw err;
    }
}
app.get("/projects", async (req, res) => {
    try {
        const projects = await getProjects();
        if (projects) {
            res.status(200).json(projects);
        } else {
            res.status(400).json({ message: "Bad Request" });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
})

/////project get by id//
async function getProjectById(id){
    try{
      const getProject = await Project.findById(id);
      return getProject;
    }catch(error){
        throw error
    }
}
app.get("/projects/:id",async(req,res)=>{
    try{
     const projectById = await getProjectById(req.params.id);
     if(projectById){
        res.status(201).json({message:"Get data successfully",data:projectById})
     }else{
        res.status(401).json({message:"Not get project"})
     }
    }catch(error){
        res.status(500).json({error:"Something went wrorng"})
    }
})

///post delete by id ///
async function deleteByProject(id){
    try{
    const deleteById = await Project.findByIdAndDelete(id);
    return deleteById;
    }catch(error){
        throw error
    }
}
app.delete("/project/:id",async(req,res)=>{
    try{
    const { id } = req.params;
   const deletedProject = await deleteByProject(id);
    if(deletedProject){
        res.status(201).json({message:"Deleted successfully",deletedProject});
    }else{
        res.status(404).json({message:"Not deleted sucesfully"})
    }
    }catch(error){
        res.status(500).json({error:"Something went wrong"})
    }
})

////poject updated ///
async function updatedById(id,body){
    try{
   const updateById= await Project.findByIdAndUpdate(  id,body,{ new: true });
   return updateById;
    }catch(error){
        throw error;
    }
}
app.post("/projects/:id",async(req,res)=>{
    try{
     const { id } = req.params;
     const updateId = await updatedById(id, req.body);
    if(updateId){
        res.status(201).json({message:"Updated successfully",data:updateId})
    }else{
        res.status(404).json({message:"Not updated successfully"})
    }
    }catch(error){
        res.status(500).json({error:"Somethimg went wrong"})
    }
})

///////User api get can be added here//////
async function getUsers(){
    try{
    const users = await User.find().select("name email");
    return users;
    }catch(error){
        throw error;
    }
}
app.get("/users",async(req,res)=>{
    try{
      const user = await getUsers();
      if(user){
        res.status(200).json({message:"User fetched successfully",data:user})
      }else{
        res.status(400).json({message:"bad request"})
      }
    }catch(err){
        res.status(500).json({message:"Internal server error"});
    }
})

////////Tags API can be added here///////

/////POST /tags : Add new tags.
async function createNewTag(newTag) {
    try {
        const tag = new Tag(newTag);
        const savedTag = await tag.save();
        return savedTag;
    } catch (err) {
        throw err;
    }
}
app.post("/tags", async (req, res) => {
    try {
        const newTag = await createNewTag(req.body);
        if (newTag) {
            res.status(201).json(newTag);
        } else {
            res.status(400).json({ message: "Bad Request" });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
})

//////////GET /tags : Fetch all tags.
async function getTags() {
    try {
        const tags = await Tag.find();
        return tags;
    } catch (err) {
        throw err;
    }
}
app.get("/tags", async (req, res) => {
    try {
        const tags = await getTags();
        if (tags) {
            res.status(200).json(tags);
        } else {
            res.status(400).json({ message: "Bad Request" });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
})

///////// user apis  can be added here //////////

/////Endpoint: POST /auth/signup :user signup////////
async function usersSignup(newUser) {
    try {
        const { name, email, password } = newUser;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        const savedUser = await user.save();
        return savedUser;
    } catch (error) {
        throw error;
    }
}
app.post("/auth/signup", async (req, res) => {
    try {
        const newuser = await usersSignup(req.body);
        if (newuser) {
            res.status(201).json({ message: "User registered successfully", user: newuser });
        } else {
            res.status(400).json({ message: "Bad request" })
        }
    } catch (error) {
        if (err.message === "Email is already registered") {
            return res.status(400).json({ message: err.message });
        }

        if (err.message === "All fields are required") {
            return res.status(400).json({ message: err.message });
        }

        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
})

///////Endpoint: POST /auth/login : user login///////

const JWT_SCRET = "your_jwt_secret_key";
async function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorization" })
        }
        const decoded = jwt.verify(token, JWT_SCRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" })
    }
}

/////POST /auth/login : user login/////
async function userlogin(data) {
    try {
        const { email, password } = data;
        if (!email || !password) {
            throw new Error("All fields are required");
        }
        ///// Check user exists////
        const user = await User.findOne({
            email,
        })
        if (!user) {
            throw new Error("Invalid email or password");
        }
        ////// Compare passwords////
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }
        ///////  // Generate Token////
        const token = jwt.sign({
            id: user._id,
            email: user.email,

        }, JWT_SCRET, { expiresIn: "1h" });
        return { token, user };
    } catch (err) {
        throw err;
    }
}
app.post("/auth/login", async (req, res) => {
    try {
        const result = await userlogin(req.body);
        if (result) {
            res.status(200).json({ message: "Login successfully", data: result });
        } else {
            res.status(400).json({ message: "Bad request" });
        }
    } catch (err) {
        res.status().json({ message: "Internal server error" });
    }
})

///////Endpoint: GET /auth/me : User Details:////

// app.get("/auth/me",authMiddleware),async(req,res)=>{
//     res.status(200).json({ message: "Access granted", user: req.user });
// }

app.get("/auth/me", authMiddleware, async (req, res) => {
    try {
        res.status(200).json({
            message: "User details fetched successfully",
            user: req.user
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
})



app.get("/", (req, res) => {
    res.send("Workasana Backend is running");
})

app.listen(8080, () => {
    console.log("Backend is running on port 8080");
})
