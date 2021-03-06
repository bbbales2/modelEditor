// specie Model - specie.js
var _ = require('underscore');
var AmpModel = require('ampersand-model');


module.exports = AmpModel.extend({
    props: {
        name: ['string'],
        initialCondition: ['number'],
        inUse: ['boolean']
    },
    initialize: function()
    {
        AmpModel.prototype.initialize.apply(this, arguments);

        //Listen for messages from stoich-specie objects
        this.listenTo(this.collection, 'stoich-specie-change', _.bind(this.updateInUse, this))

        this.updateInUse();
    },
    updateInUse: function()
    {
        var model = this;
        var baseModel = this.collection.parent;
        
        var stoichSpecieDoesNotHaveModel = function(stoichSpecie) { return stoichSpecie.specie != model; }
        
        // Make sure it's *not* used everywhere, invert
        this.inUse = !baseModel.reactions.every(
            function(reaction)
            {
                return reaction.reactants.every( stoichSpecieDoesNotHaveModel ) && reaction.products.every( stoichSpecieDoesNotHaveModel );
            }
        );
    }
});