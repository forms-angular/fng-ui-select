# fng-ui-select

Plugin for forms-angular that adds ui-select (https://github.com/angular-ui/ui-select) support.

## Usage

    bower install fng-ui-select

Add the following lines to your index.html (or equivalent) file.  Wiredep may do this for you if you are using the right
build tools).

    <link rel="stylesheet" href="/bower_components/angular-ui-select/dist/select.css">
    <script src="/bower_components/angular-ui-select/dist/select.js"></script>
    <script src="/bower_components/fng-ui-select/fng-ui-select.js"></script>

In your Mongoose schemas you can set up fields like this:

    colour: {type: String, enum: ['Blue', 'Brown', 'Green', 'Hazel'], form: {directive: 'fng-ui-select'}}
    lookup: {type: Schema.Types.ObjectId, ref: 'anotherModel', form: {directive: 'fng-ui-select'}},

Options can be added to a fngUiSelect object within the form object as follows:

* _theme_ defaults to _select2_.  Other options are _bootstrap_ and _selectize_.  Bootstrap required Bootstrap 3 and will fall
back to _select2_.
* _fngAjax_  creates a control that queries the back end after each keystroke for matches.
    * Set to true to search the whole of the _ref_ collection (honouring any collection level filters)
    * Use a mongo search object (converted to JSON and escaped) to apply a filter to the default search.  For example to search 
only amongst records where the value of *accountSuspended* is false you might do

```
    customer: {
      type: Schema.Types.ObjectId
      ref: 'customer', 
      form: {
        directive: 'fng-ui-select',
        fngUiSelect: {
          fngAjax: escape(JSON.stringify( {accountSuspended:false} ))
        } 
      }
    }
```
    
The _text_ property of the result set will be used to populate the options, unless the _additional_ option is used, in which 
case anything in the _additional_ property will be concatenated to the text.  This will be empty unless you are [overriding the
default search behaviour](http://forms-angular.org/#/forms#search).
 
* _forceMultiple_ when set to true on an array schema element will create multiple controls, rather than a single control
accepting multiple selections
* _deriveOptions_ a name of a function on the form scope that returns a property name on the scope that contains the options.  If these options will be in the form of objects which include an id and a text property you create a property _isObjects_ 
on the specified form scope property with the value _true_. 
* _additional_ appends the contents of the _additional_ property (if any) in the result set from the lookup function
* _noconvert_ inhibits the options being passed to forms-angular, so no automatic lookups are performed (sometimes useful when 
using fng-ui-select in a directive on a forms-angular form. 

## Tests

e2e tests require the forms-angular website (https://github.com/forms-angular/website)

