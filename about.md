---
layout: page
title: About
permalink: /
index: true
---

PowerGrid is a powerful grid component from [PearlChain](http://www.pearlchain.net/), written for the modern web. It's
free and open source, lightweight and low on dependencies. It's not tied into any major UI framework, so you can use it
with virtually any web application.

It was designed with performance and flexibility in mind, and already supports a number of awesome functionalities:

* Column resizing and moving
* Inline editing of cells
* Client or server-side filtering, sorting and/or row grouping
* Virtual scrolling (only the visible data is kept in the DOM, so it renders fast)
* Support for hierarchical data structures (aka treegrid)
* Grid-in-grid (a row in a grid can have a nested grid)
* Row and column freezing (so they don't scroll)

These things are nice for the users, but we've also made it nice for developers by using a modular approach so only
the features that are required need to be loaded. This reduces the load client side, as well as minimizes the effort
needed while debugging (since a lot less code is evaluated). Data loading happens through a well defined interface
of DataSources, and a number of default implementations are available. These interfaces allow you to do things like
server-side filtering, sorting or grouping, and more.