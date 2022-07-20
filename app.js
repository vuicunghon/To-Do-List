//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://vuicunghon:11337788@cluster0.irgysgl.mongodb.net/test", { useNewUrlParser: true });

//Creat Schema
const itemsSchema = {
    name: String,
};

const listSchema = {
    name: String,
    items: [itemsSchema]
};

//Creat Model
const Item = mongoose.model(
    "Item",
    itemsSchema,
);

const List = mongoose.model(
    "List",
    listSchema,
);

//Create Documents
const item1 = new Item({
    name: "Welcome to our ToDoList!",
});

const item2 = new Item({
    name: "Hit the + button to add new item!",
});

const item3 = new Item({
    name: "<-- Hit this to delete an item!",
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {

    // const day = date.getDate();
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Sucessfully Saved Default Items!");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });

});

app.get("/:customListName", function(req, res) {
    let customListName = _.capitalize(req.params.customListName);
    if (customListName) { customListName = customListName.trim() };

    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });
});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    let listName = req.body.list;
    if (listName) { listName = listName.trim() };

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            // console.log(foundList.items);
            res.redirect("/" + listName);
        });
    }


    // if (req.body.list === "Work") {
    //     workItems.push(item);
    //     res.redirect("/work");
    // } else {
    //     items.push(item);
    //     res.redirect("/");
    // }
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkboxed;
    let listName = req.body.listName;
    if (listName) { listName = listName.trim() };

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId.trim(), function(err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId.trim() } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});

app.get("/about", function(req, res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function() {
    console.log("Server started on port 3000");
});