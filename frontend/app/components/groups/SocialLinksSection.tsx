'use client';

import { useState, useEffect } from "react";
import { Twitter, Youtube, Twitch, Facebook, Instagram, Music, Globe } from "lucide-react";
import { groupsApi } from "@/lib/api";

interface SocialLink {
  name: string;
  icon: any;
  color: string;
  url: string;
  platform: string;
}

interface SocialLinksData {
  discord?: string;
  twitter?: string;
  youtube?: string;
  twitch?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

export default function SocialLinksSection({ groupId }: { groupId?: string }) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      if (!groupId) {
        setLoading(false);
        return;
      }

      try {
        const response = await groupsApi.getGroupSocialLinks(groupId);
        if (response.success && response.data) {
          const links = response.data.socialLinks as SocialLinksData;
          const formattedLinks: SocialLink[] = [];

          if (links.discord) {
            formattedLinks.push({
              name: "Discord",
              icon: Globe,
              color: "text-[#5865F2]",
              url: links.discord,
              platform: "discord"
            });
          }

          if (links.twitter) {
            formattedLinks.push({
              name: "Twitter",
              icon: Twitter,
              color: "text-[#1DA1F2]",
              url: links.twitter,
              platform: "twitter"
            });
          }

          if (links.youtube) {
            formattedLinks.push({
              name: "YouTube",
              icon: Youtube,
              color: "text-[#FF0000]",
              url: links.youtube,
              platform: "youtube"
            });
          }

          if (links.twitch) {
            formattedLinks.push({
              name: "Twitch",
              icon: Twitch,
              color: "text-[#9146FF]",
              url: links.twitch,
              platform: "twitch"
            });
          }

          if (links.facebook) {
            formattedLinks.push({
              name: "Facebook",
              icon: Facebook,
              color: "text-[#1877F2]",
              url: links.facebook,
              platform: "facebook"
            });
          }

          if (links.instagram) {
            formattedLinks.push({
              name: "Instagram",
              icon: Instagram,
              color: "text-[#E4405F]",
              url: links.instagram,
              platform: "instagram"
            });
          }

          if (links.tiktok) {
            formattedLinks.push({
              name: "TikTok",
              icon: Music,
              color: "text-[#000000] dark:text-[#FFFFFF]",
              url: links.tiktok,
              platform: "tiktok"
            });
          }

          if (links.website) {
            formattedLinks.push({
              name: "Website",
              icon: Globe,
              color: "text-blue-600",
              url: links.website,
              platform: "website"
            });
          }

          setSocialLinks(formattedLinks);
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialLinks();
  }, [groupId]);

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Social Links</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (socialLinks.length === 0) {
    return null; // Don't show section if no links
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Social Links</h2>
      
      <div className="flex flex-wrap gap-3">
        {socialLinks.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <link.icon className={`w-6 h-6 ${link.color}`} />
            <span className="text-sm text-gray-900 dark:text-gray-100">{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

