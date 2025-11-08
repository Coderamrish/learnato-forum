import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posts } from '../api';
import toast from 'react-hot-toast';

function PostDetail({ user }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedPost, setEditedPost] = useState({ title: '', content: '' });
  
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const data = await posts.getById(id);
      setPost(data);
      setEditedPost({ title: data.title, content: data.content });
    } catch (error) {
      toast.error('Failed to fetch post');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const updatedPost = await posts.update(id, editedPost);
      setPost(updatedPost);
      setEditing(false);
      toast.success('Post updated successfully!');
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await posts.delete(id);
      toast.success('Post deleted successfully!');
      navigate('/');
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

  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {editing ? (
        <form onSubmit={handleEdit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={editedPost.title}
              onChange={(e) => setEditedPost(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={editedPost.content}
              onChange={(e) => setEditedPost(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            {user._id === post.author._id && (
              <div className="space-x-4">
                <button
                  onClick={() => setEditing(true)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{post.content}</p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              Posted by <span className="font-medium">{post.author.name}</span>
            </div>
            <div>{new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostDetail;