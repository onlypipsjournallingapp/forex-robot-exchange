
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useConversations } from "@/hooks/useConversations";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import type { Chat } from "@/types/chat";

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: chats = [], isLoading: isLoadingChats } = useConversations();
  const { 
    data: messages = [], 
    isLoading: isLoadingMessages, 
    sendMessage,
    isError
  } = useConversationMessages(selectedChat?.id);

  // Update selected chat with latest messages
  const currentChat = selectedChat ? {
    ...selectedChat,
    messages,
  } : null;

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?.id || !user) return;
    
    try {
      // Use the sendMessage mutation from our hook
      await sendMessage.mutateAsync(newMessage);
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // If the selected chat is null but we have chats, select the first one
  useEffect(() => {
    if (selectedChat === null && chats.length > 0 && !isLoadingChats) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat, isLoadingChats]);

  // Show error notification if messages fail to load
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading messages",
        description: "Could not load conversation messages. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ChatList
              chats={chats}
              selectedChat={currentChat}
              onSelectChat={setSelectedChat}
              isLoading={isLoadingChats}
            />
          </div>
          
          <div className="md:col-span-2">
            <ChatWindow
              chat={currentChat}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingMessages}
              isSending={sendMessage.isPending}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
