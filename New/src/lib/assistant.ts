export function supportReply(text: string): string {
  const q = text.toLowerCase()
  if (/ship|deliver|how long|timeline/.test(q)) return 'Delivery depends on the material, quantity, and your location. Submit an order request from your 3D design and the team can confirm a production and delivery estimate before you commit. No payment is taken here.'
  if (/cost|price|pay|quote/.test(q)) return 'You can explore, create a plan, and preview a design for free in this workspace. Product pricing needs a personalized quote. Use “Order this design” to save a request with your quantity and address. No checkout or payment is required.'
  if (/logo/.test(q)) return 'A logo is entirely optional. We never add one you haven’t supplied. In the studio, open your plan and use “Upload logo” if you have a transparent PNG, JPEG, or WebP you’d like on the design.'
  if (/color|image|upload|photo/.test(q)) return 'Use the paperclip in the design chat to add a reference image. Minal samples its dominant colors, then you can pick a palette swatch. You can also set any color in the plan editor — your 2D and 3D previews will update together.'
  if (/edit|change|size|dimension/.test(q)) return 'Your plan stays editable. Open your project, choose “Product plan,” and adjust the name, colors, material, or dimensions. Then choose “View in 3D” to see your changes. Your projects are saved in this browser.'
  if (/3d|rotate|preview/.test(q)) return 'In the design preview, drag to rotate, scroll or pinch to zoom, and use the open-box control to explore the structure. Switch to 2D for a flat dieline. “Reset view” brings you back to the original angle.'
  if (/order|status/.test(q)) return 'Order requests are saved locally in this demo. You can see their status in My projects, or open the Admin workspace to manage them. They aren’t sent to a manufacturer or team automatically.'
  if (/human|admin|person|team/.test(q)) return 'Select “Design team” above to open the team inbox. This is a local demo: your messages will appear in Admin → Inbox, where you can try replying as a team member. No one is connected to a live support service.'
  if (/hello|hey|hi\b|thanks|thank you/.test(q)) return 'Hey! Good to have you here. I can help with your product plan, reference images, colors, 3D previews, or order requests. What are you working on?'
  return 'I’m the built-in minal guide. I can help with colors and image uploads, editing your plan, using the 3D preview, and placing an order request. Which of those would you like to explore? For a more specific question, switch to the Design team inbox.'
}
