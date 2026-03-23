import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { messagesApi } from '../../src/services/api';
import { Avatar, getAvatarUrl } from '../../src/components/Avatar';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { conversationId, name, avatar, receiverId } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const res = await messagesApi.getMessages(conversationId as string);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    const content = newMessage.trim();
    
    // Get receiver ID from params or from existing messages
    let targetReceiverId = receiverId as string;
    if (!targetReceiverId) {
      const otherUser = messages.find(m => m.sender_id !== user?.id);
      targetReceiverId = otherUser?.sender_id || '';
    }
    if (!targetReceiverId) return;

    // Optimistic update — show message immediately
    const tempMessage = {
      id: 'temp-' + Date.now(),
      sender_id: user?.id,
      receiver_id: targetReceiverId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setIsSending(true);
    try {
      await messagesApi.sendMessage({
        receiver_id: targetReceiverId,
        content,
      });
      // Sync with server to get real message id
      await loadMessages();
    } catch (error) {
      console.error('Failed to send:', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const doDelete = async () => {
      try {
        await messagesApi.deleteMessage(messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setSelectedMessage(null);
      } catch (error: any) {
        const msg = error.response?.data?.detail || 'Impossible de supprimer le message';
        Alert.alert('Erreur', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer ce message ?')) doDelete();
    } else {
      Alert.alert(
        'Supprimer le message',
        'Voulez-vous supprimer ce message ?',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => setSelectedMessage(null) },
          { text: 'Supprimer', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleLongPress = (messageId: string, senderId: string) => {
    if (senderId === user?.id) {
      setSelectedMessage(messageId);
      handleDeleteMessage(messageId);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const isSelected = selectedMessage === item.id;
    const showDate = index === 0 || 
      new Date(item.created_at).toDateString() !== new Date(messages[index - 1]?.created_at).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { color: theme.text }]}>
              {(() => { const d = new Date(item.created_at); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); return `${day}/${month}/${d.getFullYear()}`; })()}
            </Text>
          </View>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => handleLongPress(item.id, item.sender_id)}
          delayLongPress={500}
          style={[
            styles.messageBubbleContainer,
            isMe ? styles.myMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMe
                ? [styles.myMessage, { backgroundColor: theme.primary }]
                : [styles.otherMessage, { backgroundColor: theme.card }],
              isSelected && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.messageText, { color: isMe ? '#FFF' : theme.title }]}>
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, { color: isMe ? '#FFF' + 'AA' : theme.text + '80' }]}>
                {formatTime(item.created_at)}
              </Text>
              {isMe && (
                <Ionicons
                  name={item.is_read ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={isMe ? '#FFF' + 'AA' : theme.text + '80'}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
          {isMe && (
            <TouchableOpacity
              style={styles.deleteHint}
              onPress={() => handleDeleteMessage(item.id)}
            >
              <Ionicons name="trash-outline" size={14} color={theme.text + '40'} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header with profile photo */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border + '40' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <Avatar uri={avatar as string} name={(name as string) || 'Chat'} size={36} borderRadius={12} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerName, { color: theme.title }]} numberOfLines={1}>
            {name || 'Conversation'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  Envoyez le premier message !
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border + '40' }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
            placeholder="Votre message..."
            placeholderTextColor={theme.text + '60'}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: newMessage.trim() ? theme.primary : theme.border }]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 16, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  dateHeader: { alignItems: 'center', marginVertical: 16 },
  dateHeaderText: { fontSize: 12, fontWeight: '600', opacity: 0.5 },
  messageBubbleContainer: { marginBottom: 6 },
  myMessageContainer: { alignItems: 'flex-end' },
  otherMessageContainer: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myMessage: { borderBottomRightRadius: 4 },
  otherMessage: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  messageTime: { fontSize: 11 },
  deleteHint: { padding: 4, marginTop: 2, alignSelf: 'flex-end' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12, opacity: 0.6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, fontSize: 15, maxHeight: 100,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
