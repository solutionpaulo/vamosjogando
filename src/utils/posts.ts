import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

function isReview(post: Post): boolean {
  return post.id.startsWith('review-') || (post.data.tags?.includes('Review') ?? false);
}

export async function getAllReviews(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(isReview);
}

export async function getAllNews(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(p => !isReview(p));
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();
  for (const post of posts) {
    const tags = post.data.tags;
    if (tags && Array.isArray(tags)) {
      tags.forEach(t => tagSet.add(t));
    }
  }
  return [...tagSet].sort();
}

export function getPostsByTag(posts: Post[], tag: string): Post[] {
  return posts.filter(p => p.data.tags?.includes(tag));
}

export function getRelatedPosts(posts: Post[], current: Post, max: number = 3): Post[] {
  const currentTags = current.data.tags || [];
  if (currentTags.length === 0) return posts.filter(p => p.id !== current.id).slice(0, max);

  const scored = posts
    .filter(p => p.id !== current.id)
    .map(p => ({
      post: p,
      score: (p.data.tags || []).filter(t => currentTags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, max).map(s => s.post);
}

export async function getFeaturedPost(posts: Post[]): Promise<Post | null> {
  return posts[0] || null;
}

export async function getRecentPosts(posts: Post[], count: number = 4): Promise<Post[]> {
  return posts.slice(1, count + 1);
}

export function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
