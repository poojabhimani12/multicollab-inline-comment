/**
 * Defines allowed block names for commenting.
 * 
 * allowedBlocks.media - Media blocks like image, video etc. that support commenting.
 * 
 * allowedBlocks.text - Text blocks like paragraph, heading, quote etc. that support commenting.
 * 
 * allowedBlocks.widget - Widget blocks like calendar, tag cloud etc. that support commenting.
 * 
 * allowedBlocks.excluded - Blocks like product summary, cart items etc. that do not support commenting.
 */
const allowedBlocks = {}
//restrict to specific block names
allowedBlocks.media = ['core/image', 'core/video', 'core/audio', 'core/gallery', 'core/cover', 'core/media-text'];
//User can comment on whole block/@author Pooja Bhimani/@since EDD - 3.0.1
allowedBlocks.text = ['core/paragraph', 'core/heading', 'core/list', 'core/list-item', 'core/quote', 'core/preformatted', 'core/verse', 'core/table', 'core/pullquote', 'core/file', 'core/button', 'core/code', 'core/freeform']; // Added 'core/code' to resolve the block crash for whole comment #500 #524. @authur - Mayank / since 3.5
allowedBlocks.widget = ['core/rss', 'core/tag-cloud', 'core/latest-comments', 'core/archives', 'core/calendar', 'woocommerce/reviews-by-product', 'woocommerce/product-best-sellers', 'woocommerce/product-new', 'woocommerce/product-on-sale', 'woocommerce/product-categories', 'woocommerce/product-on-sale', 'woocommerce/product-top-rated', 'rank-math/rich-snippet', 'yoast-seo/breadcrumbs'];
allowedBlocks.excluded = ['woocommerce/product-on-sale', 'woocommerce/all-products', 'getwid/countdown', 'getwid/custom-post-type', 'getwid/post-slider', 'getwid/recent-posts', 'getwid/post-carousel', 'rank-math/rich-snippet', 'woocommerce/product-summary-field', 'woocommerce/cart-items-block', 'woocommerce/cart-totals-block', 'woocommerce/checkout-fields-block', 'woocommerce/checkout-totals-block', 'yoast-seo/breadcrumbs'];

export default allowedBlocks;