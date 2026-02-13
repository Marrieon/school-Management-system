import sqlite3
from contextlib import contextmanager
from datetime import datetime
import uuid
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'grade_manager.db')

def connect_db():
       return sqlite3.connect(DB_PATH)
# Database connection management
def get_db():
    """Connect to the SQLite database."""
    conn = sqlite3.connect('grade_manager.db', timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def db_cursor():
    """Provide a cursor with transaction management."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def student_grading(mark):
    """Convert a numeric score to a letter grade."""
    try:
        mark = int(mark)
        if 79 < mark <= 100:
            return "A"
        elif 60 <= mark <= 79:
            return "B"
        elif 49 <= mark <= 59:
            return "C"
        elif 40 <= mark <= 49:
            return "D"
        elif mark <= 40:
            return "E"
        else:
            return "invalid"
    except:
        return "invalid"

# Model Classes
class Users:
    """Manage users table operations."""
    @staticmethod
    def create(name, email, password, role, bio='', profile_photo=None):
        user_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO users (id, name, email, password, role, bio, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      (user_id, name, email, password, role, bio, profile_photo))
        return user_id

    @staticmethod
    def get_by_id(user_id):
        with db_cursor() as c:
            c.execute('SELECT id, name, email, role, bio, profile_photo FROM users WHERE id = ?', (user_id,))
            return c.fetchone()

    @staticmethod
    def get_by_email(email):
        with db_cursor() as c:
            c.execute('SELECT * FROM users WHERE email = ?', (email,))
            return c.fetchone()

    @staticmethod
    def update(user_id, name=None, email=None, password=None, bio=None, profile_photo=None):
        with db_cursor() as c:
            fields = []
            values = []
            if name:
                fields.append('name = ?')
                values.append(name)
            if email:
                fields.append('email = ?')
                values.append(email)
            if password:
                fields.append('password = ?')
                values.append(password)
            if bio:
                fields.append('bio = ?')
                values.append(bio)
            if profile_photo:
                fields.append('profile_photo = ?')
                values.append(profile_photo)
            if fields:
                values.append(user_id)
                c.execute(f'UPDATE users SET {", ".join(fields)} WHERE id = ?', values)

    @staticmethod
    def delete(user_id):
        with db_cursor() as c:
            c.execute('DELETE FROM users WHERE id = ?', (user_id,))

class Students:
    """Manage students table operations."""
    @staticmethod
    def create(student_id, name, email, teacher_id, profile_photo=None):
        with db_cursor() as c:
            c.execute('INSERT INTO students (id, name, email, teacher_id, profile_photo) VALUES (?, ?, ?, ?, ?)',
                      (student_id, name, email, teacher_id, profile_photo))

    @staticmethod
    def get_by_id(student_id):
        with db_cursor() as c:
            c.execute('SELECT id, name, email, teacher_id, profile_photo FROM students WHERE id = ?', (student_id,))
            return c.fetchone()

    @staticmethod
    def get_all():
        with db_cursor() as c:
            c.execute('SELECT id, name, email, teacher_id, profile_photo FROM students')
            return c.fetchall()

    @staticmethod
    def update(student_id, name=None, email=None, teacher_id=None, profile_photo=None):
        with db_cursor() as c:
            fields = []
            values = []
            if name:
                fields.append('name = ?')
                values.append(name)
            if email:
                fields.append('email = ?')
                values.append(email)
            if teacher_id:
                fields.append('teacher_id = ?')
                values.append(teacher_id)
            if profile_photo:
                fields.append('profile_photo = ?')
                values.append(profile_photo)
            if fields:
                values.append(student_id)
                c.execute(f'UPDATE students SET {", ".join(fields)} WHERE id = ?', values)

    @staticmethod
    def delete(student_id):
        with db_cursor() as c:
            c.execute('DELETE FROM students WHERE id = ?', (student_id,))

class Grades:
    """Manage grades table operations."""
    @staticmethod
    def create(student_id, subject, score, grade):
        grade_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO grades (id, student_id, subject, score, grade, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                      (grade_id, student_id, subject, score, grade, datetime.now()))
        return grade_id

    @staticmethod
    def get_by_student(student_id):
        with db_cursor() as c:
            c.execute('SELECT id, subject, score, grade, created_at FROM grades WHERE student_id = ? ORDER BY created_at', (student_id,))
            return c.fetchall()

    @staticmethod
    def get_all():
        with db_cursor() as c:
            c.execute('SELECT id, student_id, subject, score, grade FROM grades')
            return c.fetchall()

class Chatrooms:
    """Manage chatrooms table operations."""
    @staticmethod
    def create(name, teacher_id):
        chatroom_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO chatrooms (id, name, teacher_id, created_at) VALUES (?, ?, ?, ?)',
                      (chatroom_id, name, teacher_id, datetime.now()))
        return chatroom_id

    @staticmethod
    def get_all():
        with db_cursor() as c:
            c.execute('SELECT id, name FROM chatrooms')
            return c.fetchall()

class ChatroomMembers:
    """Manage chatroom_members table operations."""
    @staticmethod
    def add(chatroom_id, user_id):
        with db_cursor() as c:
            c.execute('INSERT OR IGNORE INTO chatroom_members (chatroom_id, user_id) VALUES (?, ?)', (chatroom_id, user_id))

    @staticmethod
    def remove(chatroom_id, user_id):
        with db_cursor() as c:
            c.execute('DELETE FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?', (chatroom_id, user_id))

    @staticmethod
    def get_members(chatroom_id):
        with db_cursor() as c:
            c.execute('SELECT user_id FROM chatroom_members WHERE chatroom_id = ?', (chatroom_id,))
            return [row['user_id'] for row in c.fetchall()]

class Messages:
    """Manage messages table operations."""
    @staticmethod
    def create(chatroom_id, user_id, content, msg_type):
        message_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO messages (id, chatroom_id, user_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                      (message_id, chatroom_id, user_id, content, msg_type, datetime.now()))
        return message_id

    @staticmethod
    def get_by_chatroom(chatroom_id):
        with db_cursor() as c:
            c.execute('SELECT id, user_id, content, type, created_at FROM messages WHERE chatroom_id = ?', (chatroom_id,))
            return c.fetchall()

class Groups:
    """Manage groups table operations."""
    @staticmethod
    def create(name, teacher_id):
        group_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO groups (id, name, teacher_id, created_at) VALUES (?, ?, ?, ?)',
                      (group_id, name, teacher_id, datetime.now()))
        return group_id

    @staticmethod
    def get_by_id(group_id):
        with db_cursor() as c:
            c.execute('SELECT id, name FROM groups WHERE id = ?', (group_id,))
            return c.fetchone()

    @staticmethod
    def get_all():
        with db_cursor() as c:
            c.execute('SELECT id, name FROM groups')
            return c.fetchall()

    @staticmethod
    def delete(group_id):
        with db_cursor() as c:
            c.execute('DELETE FROM groups WHERE id = ?', (group_id,))
            c.execute('DELETE FROM group_members WHERE group_id = ?', (group_id,))

class GroupMembers:
    """Manage group_members table operations."""
    @staticmethod
    def add(group_id, user_id):
        with db_cursor() as c:
            c.execute('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', (group_id, user_id))

    @staticmethod
    def remove(group_id, user_id):
        with db_cursor() as c:
            c.execute('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', (group_id, user_id))

    @staticmethod
    def get_members(group_id):
        with db_cursor() as c:
            c.execute('SELECT user_id FROM group_members WHERE group_id = ?', (group_id,))
            return [row['user_id'] for row in c.fetchall()]

class Targets:
    """Manage targets table operations."""
    @staticmethod
    def create(student_id, subject, target):
        target_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO targets (id, student_id, subject, target, created_at) VALUES (?, ?, ?, ?, ?)',
                      (target_id, student_id, subject, target, datetime.now()))
        return target_id

    @staticmethod
    def get_by_student(student_id):
        with db_cursor() as c:
            c.execute('SELECT id, subject, target FROM targets WHERE student_id = ?', (student_id,))
            return c.fetchall()

class Remarks:
    """Manage remarks table operations."""
    @staticmethod
    def create(student_id, teacher_id, content):
        remark_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO remarks (id, student_id, teacher_id, content, created_at) VALUES (?, ?, ?, ?, ?)',
                      (remark_id, student_id, teacher_id, content, datetime.now()))
        return remark_id

    @staticmethod
    def get_by_student(student_id):
        with db_cursor() as c:
            c.execute('SELECT id, content, created_at FROM remarks WHERE student_id = ?', (student_id,))
            return c.fetchall()

class Notifications:
    """Manage notifications table operations."""
    @staticmethod
    def create(user_id, content):
        notification_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO notifications (id, user_id, content, created_at, is_read) VALUES (?, ?, ?, ?, ?)',
                      (notification_id, user_id, content, datetime.now(), 0))
        return notification_id

    @staticmethod
    def get_by_user(user_id):
        with db_cursor() as c:
            c.execute('SELECT id, content, created_at, is_read FROM notifications WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
            return c.fetchall()

    @staticmethod
    def mark_as_read(notification_id, user_id):
        with db_cursor() as c:
            c.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', (notification_id, user_id))

class PrivateMessages:
    """Manage private_messages table operations."""
    @staticmethod
    def create(sender_id, receiver_id, content, msg_type):
        message_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO private_messages (id, sender_id, receiver_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                      (message_id, sender_id, receiver_id, content, msg_type, datetime.now()))
        return message_id

    @staticmethod
    def get_by_user(user_id):
        with db_cursor() as c:
            c.execute('SELECT id, sender_id, receiver_id, content, type, created_at FROM private_messages WHERE sender_id = ? OR receiver_id = ?', (user_id, user_id))
            return c.fetchall()

class Assignments:
    """Manage assignments table operations."""
    @staticmethod
    def create(student_id, teacher_id, title, file_path, status='Submitted'):
        assignment_id = str(uuid.uuid4())
        with db_cursor() as c:
            c.execute('INSERT INTO assignments (id, student_id, teacher_id, title, file_path, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      (assignment_id, student_id, teacher_id, title, file_path, status, datetime.now()))
        return assignment_id

    @staticmethod
    def get_by_user(user_id, role='student'):
        with db_cursor() as c:
            if role == 'student':
                c.execute('SELECT id, student_id, teacher_id, title, file_path, status, created_at FROM assignments WHERE student_id = ?', (user_id,))
            else:
                c.execute('SELECT id, student_id, teacher_id, title, file_path, status, created_at FROM assignments WHERE teacher_id = ?', (user_id,))
            return c.fetchall()

    @staticmethod
    def get_all():
        with db_cursor() as c:
            c.execute('SELECT id, student_id, teacher_id, title, file_path, status, created_at FROM assignments')
            return c.fetchall()

    @staticmethod
    def update_status(assignment_id, status):
        with db_cursor() as c:
            c.execute('UPDATE assignments SET status = ? WHERE id = ?', (status, assignment_id))