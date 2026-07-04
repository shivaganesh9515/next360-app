import React, {
  createContext, useContext, useCallback, useRef, useState, useMemo, forwardRef, useImperativeHandle,
} from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from './api';
import { useStore } from './store';
import { Product, Review } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows, getStoreAccent, getStoreAccentLight } from '../constants/theme';

const { width } = Dimensions.get('window');

interface ProductSheetContextType {
  open: (productId: string) => void;
}

const ProductSheetContext = createContext<ProductSheetContextType | undefined>(undefined);

export function useProductSheet() {
  const ctx = useContext(ProductSheetContext);
  if (!ctx) throw new Error('useProductSheet must be used within ProductSheetProvider');
  return ctx;
}

interface SheetHandle {
  open: (productId: string) => void;
}

// Snap points per CLAUDE.md: 45% quick-add, 90% full details — the sheet never navigates
// away from the underlying list, it just expands in place.
const SNAP_POINTS = ['45%', '90%'];

const ProductSheetModal = forwardRef<SheetHandle>((_, ref) => {
  const sheetRef = useRef<BottomSheet>(null);
  const { addToCart } = useStore();

  const [productId, setProductId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useImperativeHandle(ref, () => ({
    open: (id: string) => {
      setProductId(id);
      setProduct(null);
      setReviews([]);
      setQty(1);
      setExpanded(false);
      setLoading(true);
      sheetRef.current?.snapToIndex(0);

      customerApi.getProduct(id)
        .then((res: any) => setProduct(res?.data || res))
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));

      customerApi.getProductReviews(id).then((res: any) => {
        setReviews(Array.isArray(res) ? res : res?.data || []);
      }).catch(() => {});
    },
  }));

  const handleClose = useCallback(() => setProductId(null), []);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product.id, qty);
      sheetRef.current?.close();
    } catch {
      // stays open — network/stock errors surface via a stale sheet, acceptable for MVP
    } finally {
      setAdding(false);
    }
  };

  const accent = product ? getStoreAccent(product.storeType) : Colors.organic;
  const accentTint = product ? getStoreAccentLight(product.storeType) : Colors.organicLight;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      onClose={handleClose}
      onChange={(idx) => setExpanded(idx === 1)}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
    >
      {loading || !product ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <BottomSheetScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.topRow}>
            <View style={[s.imageWrap, Shadows.card, { backgroundColor: accentTint }]}>
              {product.images?.[0] ? (
                <Image source={{ uri: product.images[0] }} style={s.image} />
              ) : (
                <Ionicons name="leaf" size={40} color={accent} />
              )}
            </View>
            <View style={s.info}>
              <Text style={s.category}>{product.category?.name || product.storeType}</Text>
              <Text style={s.name} numberOfLines={2}>{product.name}</Text>
              <Text style={s.unit}>{product.unit}</Text>
              <View style={s.priceRow}>
                <Text style={s.price}>₹{Number(product.price).toFixed(0)}</Text>
                {!!product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                  <Text style={s.oldPrice}>₹{Number(product.compareAtPrice).toFixed(0)}</Text>
                )}
              </View>
              <View style={s.stockRow}>
                <View style={[s.stockDot, { backgroundColor: product.stock > 0 ? Colors.success : Colors.error }]} />
                <Text style={product.stock > 0 ? s.inStock : s.outStock}>
                  {product.stock > 0 ? `In Stock · ${product.stock} available` : 'Out of Stock'}
                </Text>
              </View>
            </View>
          </View>

          {!expanded && (
            <TouchableOpacity
              style={[s.viewDetailsBtn, { borderColor: accent }]}
              onPress={() => sheetRef.current?.snapToIndex(1)}
              hitSlop={8}
            >
              <Text style={[s.viewDetails, { color: accent }]}>View full details</Text>
              <Ionicons name="chevron-down" size={14} color={accent} />
            </TouchableOpacity>
          )}

          {expanded && (
            <View style={s.expandedSection}>
              {!!product.description && (
                <>
                  <Text style={s.sectionTitle}>Description</Text>
                  <Text style={s.description}>{product.description}</Text>
                </>
              )}

              {product.vendor?.storeName && (
                <>
                  <Text style={s.sectionTitle}>Sold by</Text>
                  <Text style={s.vendorName}>{product.vendor.storeName}</Text>
                </>
              )}

              <Text style={s.sectionTitle}>Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}</Text>
              {reviews.length === 0 ? (
                <Text style={s.noReviews}>No reviews yet.</Text>
              ) : (
                reviews.slice(0, 5).map((review) => (
                  <View key={review.id} style={s.reviewCard}>
                    <View style={s.reviewStars}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons
                          key={n}
                          name={n <= review.rating ? 'star' : 'star-outline'}
                          size={13}
                          color={Colors.brass}
                        />
                      ))}
                    </View>
                    {!!review.comment && <Text style={s.reviewComment}>{review.comment}</Text>}
                  </View>
                ))
              )}
            </View>
          )}

          <View style={s.footer}>
            <View style={s.stepper}>
              <TouchableOpacity style={s.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                <Ionicons name="remove" size={18} color={Colors.text} />
              </TouchableOpacity>
              <Text style={s.stepValue}>{qty}</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => setQty((q) => q + 1)}>
                <Ionicons name="add" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                s.addBtn,
                Shadows.button(accent),
                { backgroundColor: accent },
                (product.stock === 0 || adding) && s.addBtnDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={product.stock === 0 || adding}
            >
              {adding ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={s.addBtnText}>Add to Cart · ₹{(Number(product.price) * qty).toFixed(0)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
});
ProductSheetModal.displayName = 'ProductSheetModal';

export function ProductSheetProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<SheetHandle>(null);

  const open = useCallback((productId: string) => {
    ref.current?.open(productId);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <ProductSheetContext.Provider value={value}>
      {children}
      <ProductSheetModal ref={ref} />
    </ProductSheetContext.Provider>
  );
}

const s = StyleSheet.create({
  sheetBg: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { backgroundColor: Colors.border, width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },

  topRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  imageWrap: {
    width: width * 0.28, height: width * 0.28, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },

  info: { flex: 1, justifyContent: 'center' },
  category: { ...Typography.caption, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { ...Typography.h3, color: Colors.text, marginTop: 2 },
  unit: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.xs },
  price: { ...Typography.h2, color: Colors.brass },
  oldPrice: { ...Typography.bodySmall, color: Colors.textSecondary, textDecorationLine: 'line-through' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  inStock: { ...Typography.caption, color: Colors.success },
  outStock: { ...Typography.caption, color: Colors.error },

  viewDetailsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 6, marginBottom: Spacing.lg,
  },
  viewDetails: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold' },

  expandedSection: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  vendorName: { ...Typography.body, color: Colors.text },
  noReviews: { ...Typography.bodySmall, color: Colors.textSecondary },
  reviewCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  reviewComment: { ...Typography.bodySmall, color: Colors.text },

  footer: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md,
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 4,
  },
  stepBtn: { width: 36, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepValue: { ...Typography.body, color: Colors.text, minWidth: 24, textAlign: 'center' },

  addBtn: { flex: 1, height: 56, borderRadius: BorderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { ...Typography.button, color: Colors.white },
});
