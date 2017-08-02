// Create a schema for Book
var userSchema = {
  name: String,
  email: String,
  password: String,
};

function Users(mongoose){
	if(!mongoose) throw "mongoose not define"
	return mongoose.model('Users', mongoose.Schema(userSchema))
}

exports=module.exports = Users
