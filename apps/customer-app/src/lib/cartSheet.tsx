import React, {
  createContext, useContext, useCallback, useRef, useState, useMemo, forwardRef, useImperativeHandle,
} from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, {
  BottomSheetFlatList, BottomSheetBackdrop, BottomSheetFooter, BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from './store';
import { navigationRef } from './navigationRef';
import { getDeliveryFee } from './pricing';
import { ApiHttpError } from './api';
import { CartItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import QuantityStepper from '../components/QuantityStepper';

interface CartSheetContextType {
  open: () => void;
}

const CartSheetContext = createContext<CartSheetContextType | undefined>(undefined);

export function useCartSheet() {
  const ctx = useContext(CartSheetContext);
  if (!ctx) throw new Error('useCartSheet must be used within CartSheetProvider');
  return ctx;
}

interface SheetHandle {
  open: () => void;
}

// Pull up to see the full list comfortably; 50% is enough for a quick glance
// at what's in the cart plus the total, same "quick vs full" split as the
// Product Sheet's 45%/90%.
const SNAP_POINTS = ['50%', '85%'];

type Row = { type: 'header'; vendorName: string } | { type: 'item'; item: CartItem };

// Groups cart items by vendor, matching CLAUDE.md's OrderVendorGroup concept
// (one order splits into a group per vendor) — surfaced here as a plain
// section header since a cart is pre-order and BottomSheetFlatList doesn't
// support SectionList directly.
function buildRows(items: CartItem[]): Row[] {
  const rows: Row[] = [];
  const seenVendors = new Set<string>();
  for (const item of items) {
    const vendorName = item.product?.vendor?.storeName || 'Other items';
    if (!seenVendors.has(vendorName)) {
      seenVendors.add(vendorName);
      rows.push({ type: 'header', vendorName });
    }
    rows.push({ type: 'item', item });
  }
  return rows;
}

const CartSheetModal = forwardRef<SheetHandle>((_, ref) => {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { cartItems, cartCount, subtotal, updateCartItem, removeCartItem } = useStore();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  // Alert.alert doesn't render a real dialog on web (react-native-web has no
  // native Alert implementation), so a failed update looked like it silently
  // did nothing there. An inline banner works on every platform and shows
  // the actual cause instead of requiring devtools.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.snapToIndex(0),
  }));

  const handleClose = useCallback(() => {}, []);

  const handleQuantityChange = async (item: CartItem, nextQty: number) => {
    setBusyItemId(item.id);
    setErrorMsg(null);
    try {
      // Keyed by productId — the real PATCH/DELETE /cart/items/:productId
      // routes look the row up by (userId, productId), not this row's own id.
      if (nextQty < 1) await removeCartItem(item.productId);
      else await updateCartItem(item.productId, nextQty);
    } catch (err) {
      console.error('[cart] quantity update failed:', err);
      const status = err instanceof ApiHttpError ? err.status : undefined;
      setErrorMsg(
        status === 401
          ? 'Session expired — please log in again.'
          : `Couldn't update cart${status ? ` (${status})` : ''}. ${err instanceof Error ? err.message : ''}`.trim(),
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleCheckout = () => {
    sheetRef.current?.close();
    if (navigationRef.isReady()) {
      navigationRef.navigate('Home', { screen: 'Checkout' });
    }
  };

  const handleStartShopping = () => {
    sheetRef.current?.close();
    if (navigationRef.isReady()) {
      navigationRef.navigate('Home', { screen: 'Storefront' });
    }
  };

  const rows = useMemo(() => buildRows(cartItems), [cartItems]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  // Same BottomSheetFooter reasoning as the Product Sheet — a plain sibling
  // View doesn't reliably stay visible across snap points.
  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => {
      if (cartItems.length === 0) return null;
      const deliveryFee = getDeliveryFee(subtotal);
      const total = subtotal + deliveryFee;
      return (
        <BottomSheetFooter {...footerProps} bottomInset={0}>
          <View style={[s.footer, Shadows.raised]}>
            <View style={s.footerSummary}>
              <Text style={s.footerSubtext}>
                {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{subtotal.toFixed(0)} + {deliveryFee === 0 ? 'FREE delivery' : `₹${deliveryFee} delivery`}
              </Text>
              <Text style={s.footerTotal}>₹{total.toFixed(0)}</Text>
            </View>
            {/* Small CTA, not a full-width bar — just enough to tap through to Checkout */}
            <TouchableOpacity style={[s.checkoutBtn, Shadows.button(Colors.organic)]} onPress={handleCheckout}>
              <Text style={s.checkoutBtnText}>Checkout</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </BottomSheetFooter>
      );
    },
    [cartItems.length, cartCount, subtotal],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      // Per the Product Sheet's fix — dynamic sizing measures content instead
      // of obeying snapPoints, which caused the "stuck, won't expand" bug
      // there. Fixed points only, same as everywhere else in this app.
      enableDynamicSizing={false}
      topInset={insets.top}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>Your Cart</Text>
      </View>

      {!!errorMsg && (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={s.errorBannerText}>{errorMsg}</Text>
        </View>
      )}

      {cartItems.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="bag-handle-outline" size={56} color={Colors.border} />
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySubtitle}>Add some items to get started</Text>
          <TouchableOpacity style={[s.shopBtn, Shadows.button(Colors.organic)]} onPress={handleStartShopping}>
            <Text style={s.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <BottomSheetFlatList
          data={rows}
          keyExtractor={(row, i) => (row.type === 'header' ? `h-${row.vendorName}-${i}` : row.item.id)}
          contentContainerStyle={s.listContent}
          renderItem={({ item: row }) => {
            if (row.type === 'header') {
              return (
                <View style={s.vendorHeader}>
                  <Ionicons name="storefront" size={13} color={Colors.textSecondary} />
                  <Text style={s.vendorHeaderText}>{row.vendorName}</Text>
                </View>
              );
            }
            const item = row.item;
            return (
              <View style={s.itemRow}>
                {item.product?.images?.[0] ? (
                  <Image source={{ uri: item.product.images[0] }} style={s.itemImage} />
                ) : (
                  <View style={[s.itemImage, s.itemImagePlaceholder]}>
                    <Ionicons name="leaf" size={22} color={Colors.organic} />
                  </View>
                )}
                <View style={s.itemInfo}>
                  <Text style={s.itemName} numberOfLines={2}>{item.product?.name || 'Product'}</Text>
                  <Text style={s.itemUnit}>{item.product?.unit}</Text>
                  <Text style={s.itemPrice}>₹{Number(item.product?.price || 0).toFixed(0)}</Text>
                </View>
                {busyItemId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.organic} />
                ) : (
                  <QuantityStepper
                    value={item.quantity}
                    onDecrement={() => handleQuantityChange(item, item.quantity - 1)}
                    onIncrement={() => handleQuantityChange(item, item.quantity + 1)}
                  />
                )}
              </View>
            );
          }}
        />
      )}
    </BottomSheet>
  );
});
CartSheetModal.displayName = 'CartSheetModal';

export function CartSheetProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<SheetHandle>(null);

  const open = useCallback(() => {
    ref.current?.open();
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <CartSheetContext.Provider value={value}>
      {children}
      <CartSheetModal ref={ref} />
    </CartSheetContext.Provider>
  );
}

const s = StyleSheet.create({
  sheetBg: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { backgroundColor: Colors.border, width: 40 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.xl, marginTop: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  errorBannerText: { flex: 1, ...Typography.bodySmall, color: Colors.error },

  header: {
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },

  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 120 },

  vendorHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  vendorHeaderText: {
    ...Typography.caption, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Inter_600SemiBold',
  },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  itemImage: { width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: Colors.border },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.organicLight },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  itemUnit: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { ...Typography.bodySmall, color: Colors.brass, fontFamily: 'Inter_600SemiBold', marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.lg },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  shopBtn: {
    backgroundColor: Colors.organic, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill, marginTop: Spacing.xl,
  },
  shopBtnText: { ...Typography.button, color: Colors.white },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xl,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerSummary: { flex: 1 },
  footerSubtext: { ...Typography.caption, color: Colors.textSecondary },
  footerTotal: { ...Typography.h2, color: Colors.text, marginTop: 2 },
  // Deliberately compact — a small pill CTA, not a full-width bar.
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.organic, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  checkoutBtnText: { ...Typography.button, color: Colors.white },
});
