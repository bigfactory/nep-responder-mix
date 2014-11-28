

exports.lookup = function(name){

    try {
        require.resolve(name);
    }
    catch (e) {
        return false;
    }

    return true;
};