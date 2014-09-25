Proof of concept of a HTML5 grid component with fixed columns

Browser Targets: Chrome 37+, Safari iOS 7+, FireFox 32+, IE10+

In scope:
- fixed columns
- row grouping per column value
- column moving
- column resizing
- column hiding
- live sorting
- virtual scrolling
- grid within a grid
- row hierarchy
- inline editing & validation
- paging
- multiple selection modes: row, column, block
- fill down/right
- copy/paste blocks
- undo

Goals:
- high performance by leveraging browser-native functionality
- low footprint
- portability
- flexibility
- concurrency support (through use of Promises throughout the API)

Getting started:
- clone it
- install nodejs & npm if not done so already
- cd into the project directory
- if not done so yet, install bower and grunt: sudo npm install -g bower && sudo npm install -g grunt-cli
- npm install # install grunt tasks
- bower install # fetch javascript dependencies
- grunt bower # build requirejs config.js based on bower dependencies