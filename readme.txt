=== Team Collaboration Plugin for WordPress Editorial teams- Multicollab ===
Plugin Name: Multicollab - Google Docs-Style Editorial Collaboration for WordPress
Plugin URI: https://plugins.svn.wordpress.org/commenting-feature
Author: Multicollab
Author URI: https://www.multicollab.com/
Contributors: dots, multicollab, lkraav
Tags: Editorial, Collaboration, Comment, Editorial comments, Collaborative editing, Collaborative, Editing, Inline, Commentary, Editorial comment, Workflow, Google Docs
Requires at least: 6.2
Tested up to: 6.4
Stable tag: 4.3
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

This plugin serves the commenting feature like Google Docs within the Gutenberg Editor!

== Description ==

This code aims to initialize the commenting feature when the page finishes loading. It fetches existing comments, renders the comment interface, and sets up event listeners to handle user interactions with comments.

When the page loads, it starts an interval loop to check if the editor area has loaded yet. Once the editor is found, it clears the interval, fetches existing comments via the fetchComments() function, triggers events to re-render the comments, and stops the loading loop.
To display the comment interface, it renders a React component called Board which contains the visual interface. It uses ReactDOM to mount the Board component on the page.

It checks if the post contains custom blocks, and if not, tries to open the "activity center" sidebar which contains collaborative features.

When the document is ready, it defines functions to toggle a "pressed" class on the comment notice box when the editor is in fullscreen mode or not. This handles styling the notice box properly in both modes.

Overall, this code handles initializing the comment feature UI, fetching data, rendering components, and setting up event listeners to make the commenting system interactive on the editor page. It aims to provide a smooth editor experience for the end user while integrating the custom commenting tool.
