import React, {
  createContext, useContext, useCallback, useRef, useState, useMemo, forwardRef, useImperativeHandle,
} from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share, ScrollView, Dimensions } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView, BottomSheetBackdrop, BottomSheetFooter, BottomSheetFooterProps, useBottomSheet,
} from '@gorhom/bottom-sheet';
import Reanimated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from './api';
import { useStore } from './store';
import { useFlyToCart } from './flyToCart';
import { Product, Review } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows, getStoreAccent, getStoreAccentLight } from '../constants/theme';
import QuantityStepper from '../components/QuantityStepper';

// Collapsed thumbnail size (45% snap) vs the full-bleed hero (90% snap) — the
// image itself grows between these, driven directly by the sheet's own
// animated index so the transform tracks the drag gesture 1:1.
const COMPACT_IMAGE_SIZE = 100;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const HERO_IMAGE_SIZE = SCREEN_WIDTH - Spacing.xl * 2;

// The footer (see s.footer/s.footerSpacer) is pinned to the real screen
// bottom at every snap point by design (BottomSheetFooter's whole purpose),
// so the Add to Cart button's on-screen position can be computed directly
// instead of measured — see the note in handleAddToCart for why measuring it
// doesn't work.
const FOOTER_HEIGHT = 88;
const ADD_BTN_HEIGHT = 56;
const FLY_GHOST_SIZE = 56;
const ADD_BTN_CENTER_Y_FROM_BOTTOM = FOOTER_HEIGHT - Spacing.md - ADD_BTN_HEIGHT / 2;

// Generic, honest per-store brand copy — used for the "Why We Love Them"
// section since we have no product-specific provenance data (no fabricated
// per-product claims, only true-in-general statements about the storefront).
const STORE_HIGHLIGHTS: Record<string, { icon: string; text: string }[]> = {
  ORGANIC: [
    { icon: 'leaf', text: 'Grown without synthetic pesticides or fertilizers.' },
    { icon: 'checkmark-circle', text: 'Certified organic sourcing you can trust.' },
  ],
  NATURAL: [
    { icon: 'flower', text: 'Made with naturally derived ingredients, free from harsh chemicals.' },
    { icon: 'hand-left', text: 'Crafted using traditional, time-tested methods.' },
  ],
  ECO_FRIENDLY: [
    { icon: 'earth', text: 'Made from sustainable, eco-conscious materials.' },
    { icon: 'water', text: 'Designed to reduce environmental impact.' },
  ],
};

function formatListedDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

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

// Category / name / price / rating block — identical content shown beside the
// thumbnail when collapsed and below the hero photo when expanded; only its
// container and opacity change, so the two states read as one continuous piece.
function ProductMeta({ product }: { product: Product }) {
  return (
    <>
      <Text style={s.compactCategory} numberOfLines={1}>
        {product.category?.name || product.storeType}
      </Text>
      <Text style={s.name} numberOfLines={2}>{product.name}</Text>
      <View style={s.priceRow}>
        <Text style={s.price}>₹{Number(product.price).toFixed(0)}</Text>
        <Text style={s.unit}>/ {product.unit}</Text>
        {!!product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
          <Text style={s.oldPrice}>₹{Number(product.compareAtPrice).toFixed(0)}</Text>
        )}
      </View>
      <View style={s.metaRow}>
        {!!product.rating && (
          <>
            <View style={s.ratingGroup}>
              <Ionicons name="star" size={12} color={Colors.brass} />
              <Text style={s.ratingText}>
                {product.rating.toFixed(1)}{product.reviewCount ? ` (${product.reviewCount})` : ''}
              </Text>
            </View>
            <View style={s.metaDivider} />
          </>
        )}
        <Text style={product.stock > 0 ? s.inStock : s.outStock}>
          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </Text>
      </View>
    </>
  );
}

// The hero: a single photo that grows from a 100x100 thumbnail (45% snap) to a
// full-bleed square (90% snap), with the side-by-side text fading out as it
// grows and the same text fading back in below the now-large photo. Driven by
// `useBottomSheet().animatedIndex` (a Reanimated shared value updated on the UI
// thread by the sheet's own gesture) rather than the JS `expanded` boolean, so
// the fade/grow tracks the drag 1:1 with no lag and can't race the gesture.
function SheetHero({
  product, accent, accentTint, isWishlisted, wishlistBusy, toggleWishlist, handleShare, expanded,
}: {
  product: Product; accent: string; accentTint: string; isWishlisted: boolean; wishlistBusy: boolean;
  toggleWishlist: () => void; handleShare: () => void; expanded: boolean;
}) {
  const { animatedIndex } = useBottomSheet();

  const rowStyle = useAnimatedStyle(() => ({
    columnGap: interpolate(animatedIndex.value, [0, 1], [Spacing.lg, 0], Extrapolation.CLAMP),
  }));

  const imageStyle = useAnimatedStyle(() => {
    const size = interpolate(animatedIndex.value, [0, 1], [COMPACT_IMAGE_SIZE, HERO_IMAGE_SIZE], Extrapolation.CLAMP);
    const radius = interpolate(animatedIndex.value, [0, 1], [BorderRadius.lg, BorderRadius.xl], Extrapolation.CLAMP);
    return { width: size, height: size, borderRadius: radius };
  });

  const sideInfoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
  }));

  const belowInfoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0.55, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // Same fade as belowInfoStyle, but also removed from layout entirely while
  // collapsed — otherwise this block reserves its full height even at opacity
  // 0, leaving a dead gap between the hero and the description at 45%.
  const belowTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0.55, 1], [0, 1], Extrapolation.CLAMP),
    display: animatedIndex.value > 0.5 ? 'flex' : 'none',
  }));

  return (
    <View>
      <Reanimated.View style={[s.heroRow, rowStyle]}>
        <Reanimated.View style={[s.heroImageWrap, Shadows.card, { backgroundColor: accentTint }, imageStyle]}>
          {product.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} style={s.heroImage} />
          ) : (
            <Ionicons name="leaf" size={expanded ? 56 : 32} color={accent} />
          )}
          <Reanimated.View style={[s.heroActionsOverlay, belowInfoStyle]} pointerEvents={expanded ? 'auto' : 'none'}>
            <TouchableOpacity style={s.heroActionBtn} onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-outline" size={16} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.heroActionBtn} onPress={toggleWishlist} disabled={wishlistBusy} hitSlop={8}>
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={16}
                color={isWishlisted ? Colors.error : Colors.textSecondary}
              />
            </TouchableOpacity>
          </Reanimated.View>
        </Reanimated.View>

        <Reanimated.View style={[s.sideInfo, sideInfoStyle]} pointerEvents={expanded ? 'none' : 'auto'}>
          <ProductMeta product={product} />
        </Reanimated.View>
      </Reanimated.View>

      <Reanimated.View style={belowTextStyle} pointerEvents={expanded ? 'auto' : 'none'}>
        <ProductMeta product={product} />
      </Reanimated.View>
    </View>
  );
}

const ProductSheetModal = forwardRef<SheetHandle>((_, ref) => {
  const sheetRef = useRef<BottomSheet>(null);
  const { addToCart } = useStore();
  const { fly } = useFlyToCart();
  const insets = useSafeAreaInsets();

  const [productId, setProductId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const loadProduct = useCallback((id: string) => {
    setProductId(id);
    setProduct(null);
    setReviews([]);
    setSuggestions([]);
    setQty(1);
    setIsWishlisted(false);
    setLoading(true);

    customerApi.getProduct(id)
      .then((res: any) => {
        const p = res?.data || res;
        setProduct(p);
        if (p) {
          customerApi.getProducts({ storeType: p.storeType, categoryId: p.categoryId, limit: 8 })
            .then((r: any) => {
              const list: Product[] = Array.isArray(r) ? r : r?.data || [];
              setSuggestions(list.filter((x) => x.id !== p.id).slice(0, 6));
            })
            .catch(() => setSuggestions([]));
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));

    customerApi.getProductReviews(id).then((res: any) => {
      setReviews(Array.isArray(res) ? res : res?.data || []);
    }).catch(() => {});

    customerApi.checkWishlist(id).then((res) => {
      setIsWishlisted(!!res?.isInWishlist);
    }).catch(() => {});
  }, []);

  useImperativeHandle(ref, () => ({
    open: (id: string) => {
      setExpanded(false);
      loadProduct(id);
      // snapToIndex must run after the sheet mounts its content for this id —
      // deferring a tick avoids racing the sheet's own open animation.
      requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
    },
  }));

  const handleSuggestionPress = (item: Product) => {
    setExpanded(false);
    loadProduct(item.id);
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
  };

  const toggleWishlist = async () => {
    if (!product || wishlistBusy) return;
    setWishlistBusy(true);
    const next = !isWishlisted;
    setIsWishlisted(next);
    try {
      if (next) await customerApi.addToWishlist(product.id);
      else await customerApi.removeFromWishlist(product.id);
    } catch {
      setIsWishlisted(!next);
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleShare = () => {
    if (!product) return;
    Share.share({
      message: `${product.name} — ₹${Number(product.price).toFixed(0)} on Next360`,
    }).catch(() => {});
  };

  const handleClose = useCallback(() => setProductId(null), []);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    // Not measured via a ref — BottomSheetFooter pins itself to the sheet using
    // a Reanimated `transform: translateY`, and measureInWindow only reports a
    // view's static layout frame, never a transform applied on top of it. Any
    // ref inside the footer would report the wrong (pre-transform) position
    // (this is why the fly animation was silently not appearing). Computed
    // directly instead, since the footer's real screen position is fixed.
    fly({
      x: SCREEN_WIDTH * 0.65 - FLY_GHOST_SIZE / 2,
      y: SCREEN_HEIGHT - ADD_BTN_CENTER_Y_FROM_BOTTOM - FLY_GHOST_SIZE / 2,
      width: FLY_GHOST_SIZE,
      height: FLY_GHOST_SIZE,
      imageUri: product.images?.[0],
    });
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

  // BottomSheetFooter — the library's dedicated sticky-footer API. A plain
  // sibling View doesn't reliably stay pinned/visible at every snap point (it
  // was getting squeezed out at the shorter 45% "quick add" snap); this component
  // tracks the sheet's own animated position so the stepper + CTA are always
  // fully visible regardless of snap point.
  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => {
      if (!product) return null;
      return (
        <BottomSheetFooter {...footerProps} bottomInset={0}>
          <View style={[s.footer, Shadows.raised]}>
            <QuantityStepper
              value={qty}
              onDecrement={() => setQty((q) => Math.max(1, q - 1))}
              onIncrement={() => setQty((q) => q + 1)}
            />
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
        </BottomSheetFooter>
      );
    },
    [product, qty, adding, accent],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      // Fixed percentage snap points only — @gorhom/bottom-sheet v5 defaults
      // enableDynamicSizing to true, which sizes the sheet off *measured content
      // height* instead of our snapPoints. That was the actual root cause of the
      // "stuck at 45%, won't expand" bug: dynamic sizing measured the compact
      // header alone, locked the sheet to that height, and never grew to fit the
      // content appended when `expanded` became true. Disabling it makes our
      // explicit 45%/90% snap points the only thing controlling sheet height.
      enableDynamicSizing={false}
      topInset={insets.top}
      enablePanDownToClose
      onClose={handleClose}
      onChange={(idx) => setExpanded(idx === 1)}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
    >
      {loading || !product ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <BottomSheetScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* The hero photo + name/price grow and cross-fade in place, driven
              directly by the sheet's animated index (see SheetHero). Below it,
              the heavier detail sections are only mounted once fully expanded
              — they never replace the hero, only append after it. */}
          <SheetHero
            product={product}
            accent={accent}
            accentTint={accentTint}
            isWishlisted={isWishlisted}
            wishlistBusy={wishlistBusy}
            toggleWishlist={toggleWishlist}
            handleShare={handleShare}
            expanded={expanded}
          />

          {/* Shown at both snap points — fills the otherwise-empty space in the
              45% quick-add view instead of leaving it blank below the hero. */}
          {!!product.description && (
            <>
              <Text style={s.label}>Description</Text>
              <Text style={s.description} numberOfLines={expanded ? undefined : 3}>
                {product.description}
              </Text>
            </>
          )}

          {expanded && (
            <>
              {product.vendor?.storeName && (
                <View style={s.factGrid}>
                  <View style={s.factCol}>
                    <Text style={s.label}>Sold By</Text>
                    <Text style={s.factValue}>{product.vendor.storeName}</Text>
                  </View>
                  <View style={s.factCol}>
                    <Text style={s.label}>Listed On</Text>
                    <Text style={s.factValue}>{formatListedDate(product.createdAt)}</Text>
                  </View>
                </View>
              )}

              {!!STORE_HIGHLIGHTS[product.storeType] && (
                <View style={s.highlightsSection}>
                  <Text style={s.sectionTitle}>Why We Love Them</Text>
                  {STORE_HIGHLIGHTS[product.storeType].map((h) => (
                    <View key={h.text} style={s.highlightRow}>
                      <Ionicons name={h.icon as any} size={18} color={accent} style={s.highlightIcon} />
                      <Text style={s.highlightText}>{h.text}</Text>
                    </View>
                  ))}
                </View>
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

              {suggestions.length > 0 && (
                <View style={s.suggestionsSection}>
                  <Text style={s.sectionTitle}>You Might Also Like</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.suggestionsScroll}
                    contentContainerStyle={s.suggestionsScrollContent}
                  >
                    {suggestions.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={s.suggestionCard}
                        onPress={() => handleSuggestionPress(item)}
                      >
                        <View style={[s.suggestionImageWrap, { backgroundColor: getStoreAccentLight(item.storeType) }]}>
                          {item.images?.[0] ? (
                            <Image source={{ uri: item.images[0] }} style={s.heroImage} />
                          ) : (
                            <Ionicons name="leaf-outline" size={24} color={getStoreAccent(item.storeType)} />
                          )}
                        </View>
                        <Text style={s.suggestionName} numberOfLines={2}>{item.name}</Text>
                        <Text style={s.suggestionPrice}>₹{Number(item.price).toFixed(0)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          <View style={s.footerSpacer} />
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

  // Hero row: the photo animates its own width/height between the 100x100
  // thumbnail and the full-bleed square (see SheetHero); the row's gap
  // animates alongside it so the photo can reach true full width.
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  heroImageWrap: {
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  sideInfo: { flex: 1, justifyContent: 'center' },

  // Wishlist/share toggles overlaid on the hero photo — faded in only once expanded.
  heroActionsOverlay: { position: 'absolute', top: Spacing.md, right: Spacing.md, flexDirection: 'row', gap: Spacing.sm },
  heroActionBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
  },

  name: { ...Typography.h3, color: Colors.text },
  unit: { ...Typography.caption, color: Colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular' },
  price: { ...Typography.h2, color: Colors.brass },
  oldPrice: {
    ...Typography.bodySmall, color: Colors.textSecondary, textDecorationLine: 'line-through',
  },
  // Rating + stock combined in one row — matches the reference PDP's
  // "★ 4.9 (124) | In Stock" layout instead of two separate stacked rows.
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.md },
  ratingGroup: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { ...Typography.caption, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  metaDivider: { width: 1, height: 12, backgroundColor: Colors.border },
  inStock: { ...Typography.caption, color: Colors.success, fontFamily: 'JetBrainsMono_400Regular' },
  outStock: { ...Typography.caption, color: Colors.error, fontFamily: 'JetBrainsMono_400Regular' },

  // ProductMeta text block — reused both beside the thumbnail (collapsed)
  // and below the hero photo (expanded).
  compactCategory: {
    ...Typography.caption, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: Spacing.xs },

  sectionTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  // Small-caps gray label above a bold value — the reference PDP's key/value
  // pattern (Farm Origin / Harvest Date).
  label: {
    ...Typography.caption, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.xs,
  },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  // 2-column bordered fact block — "Sold By" / "Listed On", using real fields
  // (vendor name, listing date) in place of the reference's Farm Origin/Harvest
  // Date, since we have no per-product provenance data to show there honestly.
  factGrid: {
    flexDirection: 'row', marginTop: Spacing.lg,
    paddingVertical: Spacing.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
  },
  factCol: { flex: 1 },
  factValue: { ...Typography.body, color: Colors.text, fontFamily: 'Inter_600SemiBold' },

  highlightsSection: { marginTop: Spacing.sm },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  highlightIcon: { marginTop: 2 },
  highlightText: { ...Typography.body, color: Colors.text, flex: 1, lineHeight: 21 },

  noReviews: { ...Typography.bodySmall, color: Colors.textSecondary },
  reviewCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  reviewComment: { ...Typography.bodySmall, color: Colors.text },

  // Suggested products — horizontally scrolling, not another vertical grid,
  // so it reads as a distinct "more like this" strip at the end of the sheet.
  suggestionsSection: { marginTop: Spacing.sm },
  suggestionsScroll: { marginHorizontal: -Spacing.xl },
  suggestionsScrollContent: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  suggestionCard: { width: 120 },
  suggestionImageWrap: {
    width: 120, height: 120, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: Spacing.xs,
  },
  suggestionName: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', minHeight: 34 },
  suggestionPrice: { ...Typography.bodySmall, color: Colors.brass, fontFamily: 'Inter_600SemiBold', marginTop: 2 },

  footerSpacer: { height: 88 },

  // Sticky bar sits below the scroll content as its own bar, not inline —
  // reads as a distinct "checkout sheet" like the Behance reference's bottom bar.
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xl,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  addBtn: { flex: 1, height: 56, borderRadius: BorderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { ...Typography.button, color: Colors.white },
});
