import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Alert, Platform, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { messagesApi } from '../../src/services/api';
import { Avatar, getAvatarUrl } from '../../src/components/Avatar';
import { spacing, typography, radius } from '../../src/theme';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try {
      const res = await messagesApi.getConversations();
      setConversations(res.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const handleDeleteConversation = (convId: string) => {
    const doDelete = async () => {
      try {
        await messagesApi.deleteConversation(convId);
        setConversations(prev => prev.filter(c => c.id !== convId));
      } catch (e) { Alert.alert('Erreur', 'Impossible de supprimer'); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cette conversation ?')) doDelete();
    } else {
      Alert.alert('Supprimer', 'Supprimer cette conversation et tous les messages ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'maintenant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return (() => { const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); return `${day}/${month}/${d.getFullYear()}`; })();
  };

  const renderConversation = ({ item }: { item: any }) => {
    const hasUnread = item.unread_count > 0;
    const other = item.other_participant || item.other_user;
    return (
      <SwipeableRow onDelete={() => handleDeleteConversation(item.id)} theme={theme}>
        <TouchableOpacity
          style={[styles.convCard, { backgroundColor: hasUnread ? theme.primarySoft : theme.card }]}
          onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: item.id, name: other?.full_name || 'Chat', avatar: other?.avatar || '', receiverId: other?.id || '' } })}
          activeOpacity={0.7}
        >
          <Avatar uri={other?.avatar} name={other?.full_name || '?'} size={48} borderRadius={radius.lg} />
          <View style={styles.convContent}>
            <View style={styles.convHeader}>
              <Text style={[typography.h4, { color: theme.title, flex: 1, marginRight: spacing.sm }]} numberOfLines={1}>
                {other?.full_name || 'Utilisateur'}
              </Text>
              <Text style={[typography.tiny, { color: hasUnread ? theme.primary : theme.textSecondary }]}>
                {formatTime(item.last_message_time)}
              </Text>
            </View>
            <View style={styles.convFooter}>
              <Text style={[typography.caption, { color: hasUnread ? theme.title : theme.text, flex: 1, marginRight: spacing.sm }]} numberOfLines={1}>
                {item.last_message || 'Aucun message'}
              </Text>
              {hasUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.title }]}>Messages</Text>
      </View>
      <FlatList
        data={isLoading ? [] : conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={56} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Aucune conversation</Text>
              <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>Contactez un créatif pour commencer</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function SwipeableRow({ children, onDelete, theme }: { children: React.ReactNode; onDelete: () => void; theme: any }) {
  const translateX = new Animated.Value(0);
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) translateX.setValue(Math.max(gestureState.dx, -80));
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  });

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity style={[styles.deleteAction, { backgroundColor: '#EF4444' }]} onPress={onDelete}>
        <Ionicons name="trash" size={20} color="#FFF" />
      </TouchableOpacity>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  swipeContainer: { overflow: 'hidden', borderRadius: radius.lg, marginBottom: spacing.sm },
  deleteAction: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  convCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, gap: spacing.md },
  convContent: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
});
