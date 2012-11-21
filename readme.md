columns2000
===========

An adaptation of CSS3MultiColumn 1.02 beta, copyright (c) 2005 Cdric Savarese <pro@4213miles.com> licensed under the CC-GNU LGPL <http://creativecommons.org/licenses/LGPL/2.1/>.

Requires [jQuery 1.5](http://jquery.com) or later, best used with Modernizr.

Example usage with Modernizr:

    Modernizr.load({
        test: Modernizr.csscolumns,
        nope: '/path/to/columns2000.min.js'
    });

Example usage with conditional comments:

    <!--[if lte IE 9]><script src="/path/to/columns2000.min.js"></script><![endif]-->