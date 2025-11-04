import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Edit2, Trash2, X, Send } from 'lucide-react';
import { supabase, Post, Comment } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PostWithComments extends Post {
  comments?: Comment[];
  comment_count?: number;
}

export default function CommunityForum() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<PostWithComments[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostWithComments | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postForm, setPostForm] = useState({ title: '', content: '' });
  const [commentContent, setCommentContent] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(full_name), comments(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithCount = (data || []).map((post) => ({
        ...post,
        comment_count: Array.isArray(post.comments) ? post.comments.length : 0,
      }));

      setPosts(postsWithCount);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPostWithComments = async (postId: string) => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*, profiles(full_name)')
        .eq('id', postId)
        .maybeSingle();

      if (postError) throw postError;

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*, profiles(full_name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      setSelectedPost({
        ...postData,
        comments: commentsData || [],
      });
    } catch (error) {
      console.error('Error loading post details:', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update({
            title: postForm.title,
            content: postForm.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('posts').insert({
          user_id: user!.id,
          title: postForm.title,
          content: postForm.content,
        });

        if (error) throw error;
      }

      setShowPostModal(false);
      setEditingPost(null);
      setPostForm({ title: '', content: '' });
      loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);

      if (error) throw error;

      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setPostForm({ title: post.title, content: post.content });
    setShowPostModal(true);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim() || !selectedPost) return;

    try {
      if (editingComment) {
        const { error } = await supabase
          .from('comments')
          .update({
            content: commentContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingComment.id);

        if (error) throw error;
        setEditingComment(null);
      } else {
        const { error } = await supabase.from('comments').insert({
          post_id: selectedPost.id,
          user_id: user!.id,
          content: commentContent,
        });

        if (error) throw error;
      }

      setCommentContent('');
      loadPostWithComments(selectedPost.id);
      loadPosts();
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('Failed to save comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);

      if (error) throw error;

      if (selectedPost) {
        loadPostWithComments(selectedPost.id);
        loadPosts();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setCommentContent(comment.content);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
    setEditingPost(null);
    setPostForm({ title: '', content: '' });
  };

  if (loading) {
    return <div className="text-center py-8">Loading forum...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Forum</h2>
          <p className="text-gray-600 mt-1">Share knowledge and connect with fellow farmers</p>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          <span>New Post</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-bold text-gray-900 mb-4">Recent Discussions</h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {posts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No posts yet. Start a discussion!
                </p>
              ) : (
                posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => loadPostWithComments(post.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPost?.id === post.id
                        ? 'bg-green-50 border-2 border-green-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {post.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{post.profiles?.full_name || 'Anonymous'}</span>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{post.comment_count || 0}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            {!selectedPost ? (
              <div className="flex flex-col items-center justify-center py-16 text-center p-6">
                <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Discussion
                </h3>
                <p className="text-gray-600">
                  Choose a post from the list to view the discussion and add comments
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-[600px]">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedPost.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Posted by {selectedPost.profiles?.full_name || 'Anonymous'} on{' '}
                        {new Date(selectedPost.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedPost.user_id === user?.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPost(selectedPost)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(selectedPost.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Comments ({selectedPost.comments?.length || 0})
                  </h4>

                  {selectedPost.comments && selectedPost.comments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    selectedPost.comments?.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {comment.profiles?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </p>
                          </div>
                          {comment.user_id === user?.id && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t bg-gray-50">
                  <form onSubmit={handleAddComment} className="flex space-x-2">
                    <input
                      type="text"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder={
                        editingComment ? 'Update your comment...' : 'Add a comment...'
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {editingComment && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingComment(null);
                          setCommentContent('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!commentContent.trim()}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      <span>{editingComment ? 'Update' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h3>
              <button
                onClick={handleClosePostModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Share your knowledge, ask questions, or discuss farming topics..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePostModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
