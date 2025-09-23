import { slugify } from "./textConverter";

interface Post {
  id: string;
  data: {
    title: string;
    categories: string[];
    tags: string[];
    description?: string;
    image?: any;
    date?: Date | string;
    authors?: string[];
  };
  collection?: string;
}

/**
 * Finds related posts based on categories and tags
 * @param currentPost - The current post
 * @param allPosts - All available posts
 * @param maxLinks - Maximum number of links to return (default: 3)
 * @returns Array of related posts
 */
export function findRelatedPosts(
  currentPost: Post,
  allPosts: Post[],
  maxLinks: number = 3
): Post[] {
  // Don't include the current post
  const otherPosts = allPosts.filter((post) => post.id !== currentPost.id);
  
  // Calculate relevance score for each post
  const scoredPosts = otherPosts.map((post) => {
    let score = 0;
    
    // Score based on matching categories
    const matchingCategories = post.data.categories.filter((category) => 
      currentPost.data.categories.includes(category)
    );
    score += matchingCategories.length * 2; // Categories are weighted higher
    
    // Score based on matching tags
    const matchingTags = post.data.tags.filter((tag) => 
      currentPost.data.tags.includes(tag)
    );
    score += matchingTags.length;
    
    return { post, score };
  });
  
  // Sort by score (descending) and take top maxLinks
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLinks)
    .map((item) => item.post);
}

/**
 * Generates HTML for in-content links to related posts
 * @param content - The post content
 * @param relatedPosts - Array of related posts
 * @returns Content with injected links
 */
export function injectInContentLinks(content: string, relatedPosts: Post[]): string {
  if (!relatedPosts.length) return content;
  
  let modifiedContent = content;
  
  // Create a simple paragraph with related links
  const relatedLinksHtml = `
    <div class="related-content-links">
      <p class="text-sm font-medium text-gray-600 mb-2">Related articles:</p>
      <ul class="pl-5 mb-4">
        ${relatedPosts.map(post => 
          `<li class="mb-1"><a href="/posts/${post.id}" class="text-primary hover:underline">${post.data.title}</a></li>`
        ).join('')}
      </ul>
    </div>
  `;
  
  // Insert after the first heading or paragraph
  const insertAfterFirstHeading = modifiedContent.replace(
    /(<h[1-3][^>]*>.*?<\/h[1-3]>|<p>.*?<\/p>)/,
    '$1' + relatedLinksHtml
  );
  
  return insertAfterFirstHeading;
}

/**
 * Generates contextual links within content based on keyword matching
 * @param content - The post content
 * @param allPosts - All available posts
 * @param currentPostSlug - Current post slug to avoid self-linking
 * @param maxLinks - Maximum number of links to inject (default: 3)
 * @returns Content with injected contextual links
 */
export function injectContextualLinks(
  content: string,
  allPosts: Post[],
  currentPostId: string,
  maxLinks: number = 3
): string {
  let modifiedContent = content;
  let linksAdded = 0;
  
  // Filter out the current post
  const otherPosts = allPosts.filter(post => post.id !== currentPostId);
  
  // Sort posts by title length (descending) to prioritize longer, more specific matches
  const sortedPosts = [...otherPosts].sort(
    (a, b) => b.data.title.length - a.data.title.length
  );
  
  for (const post of sortedPosts) {
    if (linksAdded >= maxLinks) break;
    
    const postTitle = post.data.title;
    const postId = post.id;
    
    // Create a regex that matches the title but not if it's already in a link
    // This regex looks for the title not preceded by 'href=' and not inside an <a> tag
    const titleRegex = new RegExp(
      `(?<!href=["'][^"']*)(${escapeRegExp(postTitle)})(?![^<]*<\/a>)`,
      'i'
    );
    
    // Check if the title appears in the content and is not already linked
    if (titleRegex.test(modifiedContent)) {
      // Replace only the first occurrence
      modifiedContent = modifiedContent.replace(
        titleRegex,
        `<a href="/posts/${postId}" class="text-primary hover:underline">$1</a>`
      );
      linksAdded++;
    }
  }
  
  return modifiedContent;
}

/**
 * Helper function to escape special characters in a string for use in a regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
