export interface Video {
  id: number;
  videoId: string;
  title: string;
  description: string;
  posterImage: string;
  releaseDate: string;
  durationSeconds: number;
  views: number;
  likesCount: number;
  upvotes: number;
  downvotes: number;
  submittedAgo: string;
  uploadedById: number | null;
  uploadedByName: string;
  year: number;
  country: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  tags: Tag[];
  screenshots: Screenshot[];
  qualities: Quality[];
  comments: Comment[];
}

export interface VoteStatus {
  upvotes: number;
  downvotes: number;
  userVote: boolean | null;
  rating: number;
  totalVotes: number;
}

export interface Comment {
  id: number;
  videoId: number;
  userId: number;
  nickname: string;
  content: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  videoCount: number;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  videoCount: number;
  createdAt: string;
}

export interface Country {
  id: number;
  name: string;
  videoCount: number;
  createdAt: string;
}

export interface Screenshot {
  id: number;
  videoId: number;
  url: string;
  sortOrder: number;
}

export interface Quality {
  id: number;
  videoId: number;
  label: string;
  url: string;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
  videoCount?: number;
  createdAt?: string;
}

export interface Admin {
  id: number;
  username: string;
}

export interface AdminUserListItem {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
  createdAt: string;
  videoCount: number;
  commentCount: number;
  likeCount: number;
}

export interface AdminUserVideoItem {
  id: number;
  videoId: string;
  title: string;
  posterImage: string;
  views: number;
  likesCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

export interface AdminUserCommentItem {
  id: number;
  videoId: number;
  videoTitle: string;
  content: string;
  createdAt: string;
}

export interface AdminUserDetail {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
  createdAt: string;
  videoCount: number;
  commentCount: number;
  likeCount: number;
  voteCount: number;
  totalViews: number;
  recentVideos: AdminUserVideoItem[];
  recentComments: AdminUserCommentItem[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardData {
  kpis: KPIItem[];
  viewsTrend: { month: string; views: number }[];
  uploadsTrend: { date: string; count: number }[];
  categoryDist: { name: string; slug: string; count: number }[];
  topVideos: TopVideoItem[];
  viewsByCountry: { country: string; views: number; count: number }[];
  recentVideos: Video[];
  userGrowth: { date: string; count: number }[];
  topTags: { name: string; count: number }[];
  engagementRate: number;
  avgDuration: number;
}

export interface KPIItem {
  label: string;
  value: number;
  change: number;
  icon: string;
  color: string;
}

export interface TopVideoItem {
  id: number;
  title: string;
  posterImage: string;
  views: number;
  likesCount: number;
  upvotes: number;
  downvotes: number;
  durationSeconds: number;
  uploadedByName: string;
  country: string;
  createdAt: string;
}

export interface ChartData {
  viewsByMonth: { month: string; views: number }[];
  categories: { name: string; slug: string; count: number }[];
  dailyUploads: { date: string; count: number }[];
  viewsByCountry: { country: string; views: number; count: number }[];
  topTags: { name: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  viewsByHour: { hour: string; views: number }[];
  durationDist: { range: string; count: number }[];
}
