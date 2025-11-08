import { useState, useEffect } from 'react';
import { posts } from '../api';
import PostForm from './PostForm';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function PostList({ user }) {
  const [postsList, setPostsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await posts.getAll();
      setPostsList(data);
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const newPost = await posts.create(postData);
      setPostsList(prev => [newPost, ...prev]);
      setShowForm(false);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await posts.delete(postId);
      setPostsList(prev => prev.filter(post => post._id !== postId));
      toast.success('Post deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Forum Posts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Create Post
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <PostForm onSubmit={handleCreatePost} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-6">
        {postsList.map((post) => (
          <div key={post._id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  <Link to={`/posts/${post._id}`} className="hover:text-indigo-600">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4">{post.content}</p>
              </div>
              {user._id === post.author._id && (
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                Posted by <span className="font-medium">{post.author.name}</span>
              </div>
              <div>{new Date(post.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostList;