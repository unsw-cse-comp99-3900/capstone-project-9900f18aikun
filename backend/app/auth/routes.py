from flask import render_template, redirect, url_for, flash, request
from . import auth

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':

        pass
    return render_template('auth/login.html')

@auth.route('/logout')
def logout():

    return redirect(url_for('main.index'))
