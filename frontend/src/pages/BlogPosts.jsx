import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import blogs from '../blogs.json';

const BlogPost = () => {
  const { slug } = useParams();
  const post = blogs.find(blog => blog.slug === slug);

  if (!post) return <div className="text-center py-8">Post not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Helmet>
        <title>{post.title} | ServiceSoko</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={post.keywords} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-4">Published on {post.createdAt}</p>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
};

export default BlogPost;