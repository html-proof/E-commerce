from django.db import models
from django.contrib.auth.models import User
from products.models import Product


class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation #{self.id}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender.username} in Conversation #{self.conversation.id}"


class Offer(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('COUNTERED', 'Countered'),
        ('EXPIRED', 'Expired'),
    )
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='offers')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='offers')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_offers')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Offer of ${self.amount} for {self.product.name} by {self.sender.username} ({self.status})"

