function PostCollection() {
    this.posts = [];
}

PostCollection.prototype.getAllPosts = function () {
    return this.posts;
};

PostCollection.prototype.setPosts = function (postsList) {
    var length = postsList.length;
    for (var i = 0; i < length; i++) {
        var post = new Post(postsList[i].id, postsList[i].title, postsList[i].content, postsList[i].author, postsList[i].unix_created_at);
        this.posts.push(post);
    }
    viewController.setTablePosts();
};

PostCollection.prototype.addPost = function (data) {
    var post = new Post(data.id, data.title, data.content, data.author);
    this.posts.push(post);
    viewController.addRow(post);
};

PostCollection.prototype.clearPosts = function () {
    this.posts = [];
};

PostCollection.prototype.getPostById = function (id) {
    return $.grep(this.getAllPosts(), function (e) {
        return e.id == id;
    })[0];
};

PostCollection.prototype.updatePost = function (id, data) {
    var post = $.grep(this.getAllPosts(), function (e) {
        return e.id == id;
    })[0];
    post.title = data.title;
    post.content = data.content;
    post.author = data.author;
};

PostCollection.prototype.deletePost = function (id) {
    this.posts = $.grep(this.posts, function (post) {
        return post.id != id;
    });
};
var postController = new PostController();
var postCollection = new PostCollection();
var viewController = new ViewController();
var Helper = new Helper();
var limit = 5;
const BASE_API_URL = 'http://dcodeit.net/dmitry.kalenyuk/projects/rest-api-codeit/public/posts';
const FAKER_URL = 'http://dcodeit.net/dmitry.kalenyuk/practice/faker/';

postController.getPosts();

(function ($) {
    $.fn.serializeFormJSON = function () {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
})(jQuery);

function PostController() {

    this.generate = function () {
        $.ajax({
            url: FAKER_URL,
            type: 'GET',
            success: function () {
                postCollection.clearPosts();
                postController.getPosts();
                alert('New Data was generated via Faker!')
            },
            error: function () {
                alert('an error occurred while generating data')
            }
        })
    };

    this.getPosts = function () {
        $.ajax({
            url: BASE_API_URL + '?limit=' + limit,
            type: 'GET',
            success: function (result) {
                postCollection.setPosts(result);
            },
            error: function (xhr, resp, text) {
                $('.btnMore').html('Thats All').prop("disabled", true);
            }
        })
    };


    this.addPost = function (data) {
        $.ajax({
            url: BASE_API_URL + '/create',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            username: 'root',
            password: 'root',
            success: function (data) {
                $('.modal').modal('hide');
                $('#postForm').find("input[type=text]").val("");
                $('.glyphicon').removeClass("glyphicon-active");
                postCollection.clearPosts();
                postController.getPosts();
            },
            error: function (xhr) {
                var errorObject = jQuery.parseJSON(xhr.responseText);
                for (var i = 0; i < errorObject.errors.length; i++) {
                    alert(errorObject.errors[i].message);
                }
            }
        });
    };

    this.updatePost = function (id, data) {
        $.ajax({
            url: BASE_API_URL + '/edit/' + id,
            type: 'PUT',
            dataType: "JSON",
            data: JSON.stringify(data),
            success: function () {
                postCollection.updatePost(id, data);
                var $tr = $("tr[data-id='" + id + "']");
                $tr.children('td').eq(1).html(data.title);
                $tr.children('td').eq(2).html(data.content);
                $tr.children('td').eq(3).html(data.author);
                $('.modal').modal('hide');
                $('#postForm').find("input[type=text]").val("");
                $('.glyphicon').removeClass("glyphicon-active");
            },
            error: function (xhr) {
                var errorObject = jQuery.parseJSON(xhr.responseText);
                for (var i = 0; i < errorObject.errors.length; i++) {
                    alert(errorObject.errors[i].message);
                }
            }
        });
    };

    this.deletePost = function (id) {
        var html_tr = "tr[data-id='" + id + "']";
        $.ajax({
            url: BASE_API_URL + '/delete/' + id,
            type: 'DELETE',
            dataType: 'json',
            success: function () {
                postCollection.deletePost(id);
                $(html_tr).fadeOut(400, function () {
                    $(html_tr).remove();
                })
            },
            error: function () {
                alert('Deleting of post #' + id + ' failed');
            }
        });
    }
}

$('#postForm').on('submit', function (e) {
    e.preventDefault();

    var id = parseInt($(this).data('id'));
    if (id === 0) {
        postController.addPost($(this).serializeFormJSON());
    } else {
        postController.updatePost(id, $(this).serializeFormJSON());
        $(this).data('id', 0);
    }
});

$(document).on('click', '.delBtn', function () {
    var id = $(this).closest("tr").data('id');
    postController.deletePost(id);
});

$(document).on('click', '.editBtn', function () {
    var id = $(this).closest("tr").data('id');
    var post = postCollection.getPostById(id);
    $('#title').val(post.title);
    $('#content').val(post.content);
    $('#author').val(post.author);
    $('#postForm').data('id', id);
    $('#postFormModal').modal('show');
});

$('.btnMore').on('click', function () {
    Helper.lazyLoad();
});

$('.btnGenerate').on('click', function () {
    postController.generate();
});

$('.glyphicon-sort-by-attributes').on('click', function () {
    $('.glyphicon').removeClass("glyphicon-active");
    $(this).addClass("glyphicon-active");
    $('.btnMore').html('More').prop("disabled", false);
    var column = $(this).closest('th').data('sort');
    postCollection.clearPosts();
    $.ajax({
        url: BASE_API_URL + '?column=' + column + '&option=ASC&limit=' + limit,
        type: 'GET',
        success: function (result) {
            postCollection.setPosts(result);
        },
        error: function (xhr, resp, text) {
            $('.btnMore').html('Thats All').prop("disabled", true);
        }
    })
});

$('.glyphicon-sort-by-attributes-alt').on('click', function () {
    $('.glyphicon').removeClass("glyphicon-active");
    $(this).addClass("glyphicon-active");
    $('.btnMore').html('More').prop("disabled", false);
    var column = $(this).closest('th').data('sort');
    postCollection.clearPosts();
    $.ajax({
        url: BASE_API_URL + '?column=' + column + '&option=DESC&limit=' + limit,
        type: 'GET',
        success: function (result) {
            postCollection.setPosts(result);
        },
        error: function (xhr, resp, text) {
            $('.btnMore').html('Thats All').prop("disabled", true);
        }
    })
});

function ViewController() {
    this.setTablePosts = function () {
        var posts = postCollection.getAllPosts();
        var length = posts.length;

        $('#postsTable tbody').empty();

        for (var i = 0; i < length; i++) {
            $('#postsTable tbody').append(
                '<tr data-id=' + posts[i].id + '>' +
                '<td class="date">' + Helper.timeDiff(posts[i].date) + '</td>' +
                '<td>' + posts[i].title + '</td>' +
                '<td>' + posts[i].content + '</td>' +
                '<td>' + posts[i].author + '</td>' +
                '<td class="text-center">' +

                //button for edit action
                '<button class="btn btn-info btn-xs editBtn ">' +
                '<span class="glyphicon glyphicon-edit"></span></button>' +

                // button for delete action
                '<button class="btn btn-danger btn-xs delBtn ">' +
                '<span class="glyphicon glyphicon-remove-sign">' +
                '</span></button></td></tr>'
            );
        }

    };


}

function Post(id, title, content, author, unix_created_at) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.author = author;
    this.date = unix_created_at;
}

function Helper() {

    this.lazyLoad = function () {
        $('.glyphicon').removeClass("glyphicon-active");
        limit += 5;
        postCollection.clearPosts();
        postController.getPosts();
    };

    this.timeDiff = function (date) {
        return moment().from(date * 1000)
    };
}

// setInterval(function () {
//     var post = Post;
//     Helper.timeDiff(post.date)
//     console.log('s','s')
// }, 1000);