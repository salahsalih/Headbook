// Create a schema for Posts
var postSchema = {
  user_id: String,
  name: String,
  post: String,
  time: String,
};

function Posts(mongoose){
	if(!mongoose) throw "mongoose not define"
	return mongoose.model('Posts', mongoose.Schema(postSchema))
}

exports=module.exports = Posts